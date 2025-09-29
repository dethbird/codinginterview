# 1) Playlist Service (MySQL/Postgres + PHP)

Design a GraphQL API for a music app with users, playlists, tracks, and likes.

Requirements: list a user's playlists with track previews; add/remove tracks; search tracks; show "liked by me".
Constraints: PHP 8.x, MySQL/Postgres, Redis available; traffic bursts during commute hours.
Challenges: N+1 avoidance, pagination choice, authorization (owner vs collaborator), search strategy, caching.
Deliverables: schema, resolver strategy, SQL/index plan, caching plan, error model.

---

## GraphQL Schema (SDL)

```graphql
scalar ISO8601

type Query {
  me: User!
  user(id: ID!): User
  playlist(id: ID!): Playlist
  playlists(ownerId: ID, first: Int = 20, after: String): PlaylistConnection!
  searchTracks(q: String!, first: Int = 25, after: String): TrackConnection!
}

type Mutation {
  createPlaylist(input: CreatePlaylistInput!): Playlist!
  addTrack(playlistId: ID!, trackId: ID!, position: Int): Playlist!
  removeTrack(playlistId: ID!, trackId: ID!): Playlist!
  likeTrack(trackId: ID!): LikePayload!
  unlikeTrack(trackId: ID!): LikePayload!
}

input CreatePlaylistInput { name: String!, isPublic: Boolean = false }
type LikePayload { trackId: ID!, liked: Boolean! }

type User {
  id: ID!
  displayName: String!
  playlists(first: Int = 20, after: String): PlaylistConnection!
}

type Playlist {
  id: ID!
  name: String!
  owner: User!
  isPublic: Boolean!
  collaborators: [User!]!
  tracks(first: Int = 50, after: String): PlaylistTrackConnection!
  createdAt: ISO8601!
  updatedAt: ISO8601!
}

type PlaylistTrack { track: Track!, addedAt: ISO8601!, addedBy: User! }
type PlaylistTrackConnection { edges: [PlaylistTrackEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type PlaylistTrackEdge { node: PlaylistTrack!, cursor: String! }

type PlaylistConnection { edges: [PlaylistEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type PlaylistEdge { node: Playlist!, cursor: String! }

type Track {
  id: ID!
  title: String!
  artist: String!
  album: String
  durationMs: Int!
  previewUrl: String
  likedByMe: Boolean!
}

type TrackConnection { edges: [TrackEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type TrackEdge { node: Track!, cursor: String! }

type PageInfo { hasNextPage: Boolean!, endCursor: String }
```
Notes:
- likedByMe resolves from a per-user likes table with DataLoader.
- Connections use cursor pagination for stability during inserts. For admin tools you may expose an offset-based variant.

---

## SQL and Index Plan (Postgres syntax)

```sql
CREATE TABLE users (
  id           bigserial PRIMARY KEY,
  display_name text NOT NULL
);

CREATE TABLE tracks (
  id           bigserial PRIMARY KEY,
  title        text NOT NULL,
  artist       text NOT NULL,
  album        text,
  duration_ms  int NOT NULL,
  preview_url  text
);
CREATE INDEX tracks_title_trgm ON tracks USING gin (title gin_trgm_ops);
CREATE INDEX tracks_artist_trgm ON tracks USING gin (artist gin_trgm_ops);

CREATE TABLE playlists (
  id          bigserial PRIMARY KEY,
  owner_id    bigint NOT NULL REFERENCES users(id),
  name        text NOT NULL,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON playlists (owner_id, updated_at DESC);

CREATE TABLE playlist_collaborators (
  playlist_id bigint NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (playlist_id, user_id)
);

CREATE TABLE playlist_tracks (
  playlist_id bigint NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    bigint NOT NULL REFERENCES tracks(id),
  position    int NOT NULL,
  added_by    bigint NOT NULL REFERENCES users(id),
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id)
);
CREATE UNIQUE INDEX playlist_tracks_order ON playlist_tracks (playlist_id, position);
CREATE INDEX playlist_tracks_playlists ON playlist_tracks (playlist_id, added_at DESC);

CREATE TABLE likes (
  user_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id bigint NOT NULL REFERENCES tracks(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);
CREATE INDEX likes_track ON likes (track_id);
```

Sort and Cursor:
- tracks within a playlist sorted by (position ASC, track_id ASC) for stable seek.
- playlists sorted by (updated_at DESC, id DESC).

Cursors encode the sort keys as base64 JSON and use a seek WHERE clause such as
`WHERE (position, track_id) > (:pos, :id)` for ASC or `<` for DESC.

---

## Resolver Strategy and N+1 Avoidance
- Root queries fetch compact slices; child resolvers batch with DataLoader:
  - Track.likedByMe: batch (userId, trackId) into one query.
  - Playlist.collaborators: DataLoader on playlist_id -> join table -> users.
  - Playlist.tracks: one query per page, not per track.
- When inserting at an index, use SELECT ... FOR UPDATE SKIP LOCKED on the affected range to prevent race conditions.

Example likedByMe batch:
```sql
SELECT track_id
FROM likes
WHERE user_id = :me AND track_id = ANY(:track_ids);
```

---

## Search Strategy
- Start in DB with pg_trgm for tracks.title and tracks.artist.
- Ranking example: similarity(title,$q) + 0.5*similarity(artist,$q).
- Later, migrate to OpenSearch/Meilisearch behind the same searchTracks API.

---

## Caching Plan
Layers:
1) Response cache for public playlist pages (Redis; TTL 60s; stale-while-revalidate 30s).
2) Per-entity cache for hot tracks and playlist metadata (TTL 300s).
3) Edge caching for persisted queries.

Invalidation:
- On add/remove track: bump a versioned key prefix for playlist id (playlist:{id}:v{n}:*).
- On like/unlike: short TTL only; do not globally invalidate.

---

## Authorization
- Owner or collaborator can mutate the playlist; readers require isPublic or membership.

---

## Error Model
Typed codes: PLAYLIST_NOT_FOUND, FORBIDDEN, TRACK_ALREADY_EXISTS, POSITION_CONFLICT, RATE_LIMITED.
Null failed nodes with errors including path for partial failures.

---

## Burst Handling
- Persisted queries + CDN for public reads.
- Per-user rate limiter, e.g., 60 mutations/min (Redis token bucket).

---

## Lightning Follow-ups

Soft vs hard deletes:
- Soft-delete playlists with deleted_at to allow undo. Hard delete via a retention job.

Optimistic UI:
- Include mutationId in the request; server echoes it. Client updates optimistically and reconciles using the echoed version.

Rate limiting per user:
- Token bucket in Redis at rl:user:{id}:mut, capacity 60, refill 1/sec. Over-cap returns 429 with retryAfter in extensions.


# Questions

- Can I basically treat `Connection` like "pagination" almost interchangeably?
  - ```graphql 
      type PlaylistTrackConnection { edges: [PlaylistTrackEdge!]!, pageInfo: PageInfo!, totalCount: Int }
    ```
  - ```graphql 
      type PlaylistConnection { edges: [PlaylistEdge!]!, pageInfo: PageInfo!, totalCount: Int }
    ```
- What is "using `gin`"?
  - ```sql
    CREATE INDEX tracks_title_trgm ON tracks USING gin (title gin_trgm_ops);
    CREATE INDEX tracks_artist_trgm ON tracks USING gin (artist gin_trgm_ops);
    ```
- 
  Can you explain more about how this works: "Cursors encode the sort keys as base64 JSON and use a seek WHERE clause such as WHERE (position, track_id) > (:pos, :id) for ASC or < for DESC."

- What does this mean: "When inserting at an index, use SELECT ... FOR UPDATE SKIP LOCKED on the affected range to prevent race conditions."
- What is `pg_trgm`: "Start in DB with pg_trgm for tracks.title and tracks.artist."
- Does this mean "cache on save": "Edge caching for persisted queries."
- How does a Redis token bucket rate limit? "Per-user rate limiter, e.g., 60 mutations/min (Redis token bucket)."