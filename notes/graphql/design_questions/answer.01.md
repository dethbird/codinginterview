### 1) Playlist Service (MySQL/Postgres + PHP)

You’re designing a GraphQL API for a music app: users, playlists, tracks, likes.

* **Requirements:** list a user’s playlists with track previews; add/remove tracks; search tracks; show “liked by me.”
* **Constraints:** PHP 8.x, MySQL/Postgres, Redis available; traffic bursts during commute hours.
* **Challenges to address:** N+1 avoidance, pagination choice, authZ (owner vs collaborator), search strategy, caching.
* **Deliverables:** schema (Query/Mutation/types), resolver strategy, SQL/index plan, caching plan, error model.
* **Lightning follow-ups:** soft deletes vs hard deletes; optimistic UI support; rate limiting per user.

Db schema psedo-sql:

```sql
CREATE TABLE `user` (
    id: BIGSERIAL primary,
    email: TEXT UNIQUE
);

CREATE TABLE `playlist` (
    id: BIGSERIAL primary,
    name: TEXT,
    user_id: BIGINT references `user`.`id`;
)

CREATE TABLE `track` (
    id: BIGSERIAL primary,
    title: TEXT,
    duration_ms: INTEGER,
    preview_url: TEXT;
)

CREATE TABLE `user_track_likes` (
    user_id: BIGINT references `user`.`id`;,
    track_id: BIGINT references `track`.`id`,
    liked_at: DATE
)

CREATE TABLE `playlist_track` (
    playlist_id: BIGINT references `playlist`.`id`,
    track_id: BIGINT references `track`.`id`
)

/** @todo create indexes for playlist_song_playlist_id, playlist_song_song_id  */
```


```graphql
type User {
    id: ID!,
    email: String!
    playlists(limit: Int = 50, offset: Int = 0): [Playlist!]!
}

type Playlist {
    id: ID!,
    name: String!,
    tracks(limit: Int = 50, offset: Int = 0): [Track!]!
}

type Track {
    id: ID!,
    title: String!,
    artist: String!,
    duration_ms: Int!,
    preview_url: String!
}

input AddTrackToPlaylistInput {
    playlist_id: ID!,
    track_id: ID!
}

type Query {
    addTrackToPlaylist(user_id: ID, limit: Int = 20, offset: Int = 0): [Playlist!]!
    tracks(search: String, limit: Int = 20, offset: Int = 0): [Track!]!
    userLikedTracks(user_id: ID, order: String = 'title asc'): [Track!]!
}
```
type Mutation {
    addTrackToPlaylist(input: AddTrackToPlaylistInput!): Playlist!
    removeTrackFromPlaylist(playlist_id: ID, track_id: Int): Playlist!
}
```

Resolvers:

parent: User. It has an edge: playlists;
We use userId to fetch the user's playlists, and collect playlist ids.
Joining playlist ids, we fetch all tracks, and cache by track_id in case one track is in more than one playlist
This resolves to Playlist.tracks under User.playlists. 
If we wanted to, we could use the user id from the parent when fetching tracks to left join on the `user_track_likes` to eager-fetch whether the user liked the track or not.

N+1 avoidance is done by the sql JOIN and by caching mentioned in resolvers.

Pagination could have gone with limit/offset or cursor, but there didn't seem to be enough detail on the tables to make a useable cursor.

sql indexing: add indexing to foreign keys to speed up joins.

error model: 'data' will contain null for any failing services, and `errors` will contain error codes, query locations, and other helpful debugging information for the client side. 

---

Love the structure—you hit schema, resolvers, indexing, pagination, and the error model. Here’s tight interview-tuning feedback so your answer lands crisp:

### What’s strong

* Clear **SDL** mapping to the DB.
* You’re thinking about **batching** + **JOINs** to kill N+1.
* You mention **indexes** and the **GraphQL error shape** (data + errors).

### Key fixes (high impact)

* **Queries vs Mutations:**

  * `addTrackToPlaylist` is listed under **Query**; it must be a **Mutation**.
  * Your SDL code block has a stray closing ```—clean up formatting.
* **Auth & context:**

  * Don’t pass `user_id` as an arg for “liked by me” or listing *my* playlists; take the **viewer** from **context**.
  * Add `Track.likedByMe: Boolean!` (resolved from context + `user_track_likes`), and gate mutations by **owner/collaborator**.
* **Relationships & ordering:**

  * `playlist_track` needs a **position** column (and `(playlist_id, position)` index) to order tracks deterministically.
  * Consider **soft deletes** (e.g., `deleted_at`) on playlists/tracks if you plan to support undo/audit.
* **Pagination:**

  * You can cursor-page even now:

    * **Playlists:** sort by `(created_at DESC, id DESC)` → cursor = base64 of those keys.
    * **Tracks-in-playlist:** sort by `(position ASC, track_id ASC)` → cursor from `(position, track_id)`.
  * Offset is fine for admin views; cursors are better for feeds.
* **Table & SQL nits:**

  * Don’t name a table `user` (reserved in some contexts); use `users`.
  * Use real SQL types/constraints (`TEXT`/`VARCHAR`, `TIMESTAMPTZ`, `PRIMARY KEY`, `UNIQUE (user_id, track_id)` in likes, `PRIMARY KEY (playlist_id, track_id)` in join table).
  * Add `created_at` to `playlists` for stable ordering and `updated_at` if clients need freshness.
* **Search strategy:**

  * Call out **text search** explicitly: Postgres `GIN` on `to_tsvector(title || ' ' || artist)` (or MySQL FULLTEXT) for `tracks(search: ...)`.
* **Caching & bursts:**

  * Spell out Redis keys and invalidation:

    * Entities: `track:{id}`, `playlist:{id}` (TTL 5–15m).
    * Lists: `user:{id}:playlists:{cursor}` (short TTL + **stale-while-revalidate**).
    * Invalidate on mutations by tagging (e.g., bust `playlist:{id}` and affected list keys).
  * Consider **persisted queries** + CDN for read-heavy endpoints during commute spikes.
* **Error model details:**

  * Mention `errors[].extensions.code` (`UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`) and a `correlationId` for tracing.

### Small SDL tweaks (naming/readability)

* Prefer camelCase: `durationMs`, `previewUrl`.
* Add fields the product needs: `Playlist.trackCount: Int!`, `Playlist.owner: User!`, `Track.likedByMe: Boolean!`.
* Inputs for mutations should accept an optional `clientMutationId` to support optimistic UI.

### Indices you can name quickly

* `playlists(owner_id)`, `playlists(created_at DESC, id DESC)`
* `playlist_track(playlist_id, position)`, `playlist_track(track_id)`
* `user_track_likes(user_id, track_id) UNIQUE`
* `tracks(title)`, `tracks(artist)` (+ text index as above)

### Resolver strategy (one-liners you can say)

* `User.playlists` → DataLoader batch by `owner_id`.
* `Playlist.tracks` → DataLoader batch by `playlist_id`, ordered by `position`.
* `Track.likedByMe` → single batched lookup on `(user_id, track_id)` across all tracks in view.

If you want, I can mark up your SDL/SQL with just the minimal edits above so you have a “final form” to read from in the interview, or we can run a 5-minute mock where you present this and I ask follow-ups on authZ, caching, and pagination trade-offs.

---

Here’s your **tightened “final form”** with minimal but high-impact edits you can read from in the interview.

# SQL (Postgres-flavored)

```sql
-- Users (avoid "user" as a table name)
CREATE TABLE users (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playlists
CREATE TABLE playlists (
  id           BIGSERIAL PRIMARY KEY,
  owner_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_playlists_owner ON playlists(owner_id);
CREATE INDEX idx_playlists_order ON playlists(created_at DESC, id DESC);

-- Tracks
CREATE TABLE tracks (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  artist       TEXT NOT NULL,
  duration_ms  INT NOT NULL,
  preview_url  TEXT
);
-- Optional: simple text search (Postgres)
-- CREATE INDEX idx_tracks_fts ON tracks USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(artist,'')));

-- Likes (one per user/track)
CREATE TABLE user_track_likes (
  user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id  BIGINT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  liked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

-- Playlist <-> Tracks (with position for ordering)
CREATE TABLE playlist_track (
  playlist_id BIGINT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    BIGINT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position    INT NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);
CREATE INDEX idx_playlist_track_playlist ON playlist_track(playlist_id, position);
CREATE INDEX idx_playlist_track_track ON playlist_track(track_id);
```

# GraphQL SDL (schema-first, camelCase, cursor-ready)

```graphql
scalar DateTime

type User {
  id: ID!
  email: String!
  playlists(first: Int = 20, after: String): PlaylistConnection!
  likedTracks(first: Int = 20, after: String): TrackConnection!
}

type Playlist {
  id: ID!
  name: String!
  owner: User!
  trackCount: Int!
  tracks(first: Int = 50, after: String): TrackConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Track {
  id: ID!
  title: String!
  artist: String!
  durationMs: Int!
  previewUrl: String
  likedByMe: Boolean!       # derived from context + user_track_likes
}

# Connections (cursor pagination)
type PlaylistEdge { node: Playlist!, cursor: String! }
type PlaylistConnection { edges: [PlaylistEdge!]!, pageInfo: PageInfo! }

type TrackEdge { node: Track!, cursor: String! }
type TrackConnection { edges: [TrackEdge!]!, pageInfo: PageInfo! }

type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
}

type Query {
  me: User
  user(id: ID!): User
  tracks(search: String, first: Int = 20, after: String): TrackConnection!
}

input AddTrackToPlaylistInput {
  playlistId: ID!
  trackId: ID!
  position: Int
  clientMutationId: String
}

input RemoveTrackFromPlaylistInput {
  playlistId: ID!
  trackId: ID!
  clientMutationId: String
}

type AddTrackToPlaylistPayload {
  clientMutationId: String
  playlist: Playlist!
}

type RemoveTrackFromPlaylistPayload {
  clientMutationId: String
  playlist: Playlist!
}

type Mutation {
  addTrackToPlaylist(input: AddTrackToPlaylistInput!): AddTrackToPlaylistPayload!
  removeTrackFromPlaylist(input: RemoveTrackFromPlaylistInput!): RemoveTrackFromPlaylistPayload!
}
```

# Resolver strategy (one-paragraph cheat lines)

* **Auth/context:** derive the viewer from JWT → `context.userId`. Don’t accept `userId` as args for “my” data.
* **Batching:**

  * `User.playlists` → DataLoader keyed by `owner_id`.
  * `Playlist.tracks` → DataLoader keyed by `playlist_id`, ordered by `position`.
  * `Track.likedByMe` → batched lookup on `(user_id, track_id)` across all visible tracks.
* **Cursoring:**

  * Playlists: order `(created_at DESC, id DESC)`; encode `{createdAt,id}` as cursor.
  * Tracks-in-playlist: order `(position ASC, track_id ASC)`; encode `{position,trackId}`.
  * Fetch `first + 1` to set `hasNextPage`.
* **Counts:** `Playlist.trackCount` uses a batched `COUNT(*) GROUP BY playlist_id`.
* **Search:** start with `ILIKE` or FTS (Postgres GIN). Return `TrackConnection`.

# Caching & bursts (quick plan)

* **Entities:** `playlist:{id}`, `track:{id}` (TTL 5–15m).
* **Lists:** `user:{id}:playlists:{cursor}`, `playlist:{id}:tracks:{cursor}` (short TTL; stale-while-revalidate).
* **Invalidation:** on add/remove track → bust `playlist:{id}` and the affected list keys.
* **Edge:** persisted queries (APQ) so CDN can cache GETs during commute spikes.

# Error model (what you’ll say)

* Partial data in `data`, failures in `errors[]` with `path`, `locations`, and `extensions.code` (`UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`) plus a `correlationId`.

If you want, I can also drop a **mini resolver pseudocode** for the two hot edges (`User.playlists`, `Playlist.tracks`) using a DataLoader signature you can quote verbatim.
