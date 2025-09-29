# 3) Multi-Tenant SaaS with Row-Level Security (RLS)

## Scenario
B2B notes app with **organizations**, **users**, **notes**, **tags**. Tenants must be isolated. PHP backend, Postgres with **Row-Level Security**, JWT carries `sub`, `org_id`, and `roles`.

Goals: users only see org-scoped data; admins invite users; audit access.

---

## Data Model (Postgres)
```sql
-- Organizations
CREATE TABLE orgs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Users (global identity)
CREATE TABLE users (
  id          uuid PRIMARY KEY,
  email       citext UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Memberships: user in org with roles
CREATE TABLE memberships (
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roles       text[] NOT NULL CHECK (roles <> '{}'),
  PRIMARY KEY (org_id, user_id)
);

-- Notes are strictly org-scoped; owner is optional for team notes
CREATE TABLE notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id    uuid REFERENCES users(id),
  title       text NOT NULL,
  body        text NOT NULL,
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Tags & join table
CREATE TABLE tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  UNIQUE(org_id, name)
);

CREATE TABLE note_tags (
  note_id     uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX ON notes (org_id, updated_at DESC);
CREATE INDEX ON tags (org_id, name);
```

---

## Enable Row-Level Security & Policies
We bind Postgres session to the **current org** and **user** using `SET LOCAL` or `jwt.claims` via a trusted extension (e.g., pgjwt) or by using **secure application role** that sets `app.current_org` and `app.current_user` vars.

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Helper: only members of the org can see org rows
CREATE POLICY notes_isolation ON notes
  USING (org_id = current_setting('app.current_org')::uuid AND is_deleted = false);

CREATE POLICY tags_isolation ON tags
  USING (org_id = current_setting('app.current_org')::uuid);

-- Write policies
CREATE POLICY notes_write ON notes
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org')::uuid)
  TO app_user;

CREATE POLICY notes_update ON notes
  FOR UPDATE USING (org_id = current_setting('app.current_org')::uuid)
             WITH CHECK (org_id = current_setting('app.current_org')::uuid)
  TO app_user;

-- Membership visibility limited to your org
CREATE POLICY memberships_read ON memberships
  FOR SELECT USING (org_id = current_setting('app.current_org')::uuid);
```

**Important:** Application connects as a low-privileged role `app_user` and sets:
```sql
SET LOCAL app.current_org = '<org_uuid>';
SET LOCAL app.current_user = '<user_uuid>';
SET LOCAL app.current_roles = '{admin,user}';
```
These are derived from the **verified JWT** in the PHP layer.

---

## AuthN vs AuthZ Boundaries
- **AuthN (authentication)**: verify JWT (signature, exp, nbf, aud). Extract `sub`, `org_id`, `roles`.
- **AuthZ (authorization)**: two layers
  1) **Coarse** in GraphQL (e.g., only admins can call `inviteUser`).  
  2) **Fine-grained** in Postgres via **RLS** (cannot be bypassed by buggy resolvers).

---

## GraphQL Schema (SDL)
```graphql
scalar ISO8601
directive @requiresRole(any: [String!]) on FIELD_DEFINITION

type Query {
  me: Me!
  notes(filter: NotesFilter, first: Int = 20, after: String): NoteConnection!
  tags(search: String, first: Int = 20, after: String): TagConnection!
}

type Mutation {
  createNote(input: CreateNoteInput!): Note!
  updateNote(id: ID!, input: UpdateNoteInput!): Note!
  deleteNote(id: ID!): DeletePayload! @requiresRole(any: ["admin"])
  inviteUser(email: String!, roles: [String!]!): InvitePayload! @requiresRole(any: ["admin"])
}

type Me { userId: ID!, orgId: ID!, roles: [String!]! }

input NotesFilter { tagIds: [ID!], text: String, ownerId: ID }
type NoteConnection { edges: [NoteEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type NoteEdge { node: Note!, cursor: String! }
type Note {
  id: ID!
  title: String!
  body: String!
  ownerId: ID
  tags: [Tag!]!
  createdAt: ISO8601!
  updatedAt: ISO8601!
}
type TagConnection { edges: [TagEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type TagEdge { node: Tag!, cursor: String! }
type Tag { id: ID!, name: String! }

type DeletePayload { id: ID!, success: Boolean! }
type InvitePayload { invited: Boolean!, userId: ID }
```
- `@requiresRole` is a custom directive that performs **coarse** checks in resolvers.
- Pagination via **cursor** to keep results stable inside an org.

---

## Resolver Strategy
- On each request, after JWT verification, open a DB tx and set:
  - `SET LOCAL app.current_org = $jwt.org_id`
  - `SET LOCAL app.current_user = $jwt.sub`
  - `SET LOCAL app.current_roles = $jwt.roles`
- All reads/writes happen within this scope; **RLS enforces isolation**.
- Full-text search: use `to_tsvector('simple', title || ' ' || body)` with org_id in index `(org_id, tsv)`.

Example read:
```sql
SELECT * FROM notes
 WHERE org_id = current_setting('app.current_org')::uuid
   AND is_deleted = false
 ORDER BY updated_at DESC, id
 LIMIT 21 OFFSET 0;
```

---

## Field-Level Permissions
If certain fields (e.g., `Note.body`) should be hidden from non-owners, create **additional policies** or a **view**:
```sql
CREATE VIEW notes_safe AS
SELECT id, org_id, owner_id, title,
       CASE WHEN current_setting('app.current_user')::uuid = owner_id
            OR 'admin' = ANY(string_to_array(current_setting('app.current_roles'), ','))
            THEN body ELSE NULL END AS body,
       created_at, updated_at, is_deleted
FROM notes;

ALTER VIEW notes_safe OWNER TO app_owner;
GRANT SELECT ON notes_safe TO app_user;

-- Then point GraphQL reads to notes_safe.
```

---

## Query Complexity Limits
- Depth limit (e.g., 8) and cost model (e.g., `notes: 2 + 0.01*first`).
- Per-tenant rate limits in the API gateway (token bucket; e.g., 600 ops/min/tenant).

---

## Auditing
- Use **write-ahead triggers** to log access:
```sql
CREATE TABLE audit_access (
  at         timestamptz NOT NULL DEFAULT now(),
  org_id     uuid NOT NULL,
  user_id    uuid NOT NULL,
  action     text NOT NULL,     -- READ_NOTE, UPDATE_NOTE, etc.
  entity_id  uuid,
  meta       jsonb
);

CREATE OR REPLACE FUNCTION log_note_read()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit_access(org_id, user_id, action, entity_id, meta)
  VALUES (current_setting('app.current_org')::uuid,
          current_setting('app.current_user')::uuid,
          TG_ARGV[0], NEW.id, NULL);
  RETURN NEW;
END; $$;

-- Example: on SELECT via a SECURITY BARRIER view
CREATE VIEW notes_audited SECURITY BARRIER AS
  SELECT * FROM notes WHERE is_deleted = false
   AND org_id = current_setting('app.current_org')::uuid;

-- Attach an AFTER trigger ON SELECT is not supported; instead, log in resolvers for reads,
-- and use DB triggers for INSERT/UPDATE/DELETE.
```
- Practical approach: **log reads in the resolver** (include org/user/id), and use DB triggers for writes.

---

## Invites Flow
1) Admin calls `inviteUser(email, roles)`  
2) Server creates or finds `users.email`, creates `memberships(org_id, user_id, roles)` with **pending** status and sends email.  
3) On accept, issue JWT bound to that `org_id` and roles.

---

## Deletion Strategy
- **Soft delete** notes (`is_deleted=true`) to support undo and audit trails. Exclude in RLS.
- Optional **hard delete** job that purges after retention window per tenant.

---

## Testing Permissions
- Matrix tests across roles `{admin, user, viewer}` × operations × orgs.
- DB-level tests: run queries with `SET LOCAL` vars to assert that cross-org reads return **0 rows**.

---

## Quick Study TL;DR
- JWT → set `app.current_org/user/roles` in DB session.  
- Postgres **RLS** on every tenant-scoped table ensures isolation.  
- GraphQL does **coarse** role checks; DB enforces **fine** policy.  
- Use cursor pagination, soft deletes, and audit logging; add full-text index per org.  
- Test matrix across roles & orgs; never bypass RLS with superuser connections.

---

# Questions

- Does "Postgres with Row-Level Security" essentially mean adding a tenant field to rows that need security?
  - What does `ALTER TABLE notes ENABLE ROW LEVEL SECURITY;` do?
- Do these get set and executed in the db at the gateway level:
  - ```sql
    SET LOCAL app.current_org = '<org_uuid>';
    SET LOCAL app.current_user = '<user_uuid>';
    SET LOCAL app.current_roles = '{admin,user}';
    ```
- Is `@requiresRole` a built-in directive. Can you explain more?
  - `directive @requiresRole(any: [String!]) on FIELD_DEFINITION`
- I need more trigger syntax for mutations insert/update/delete logging triggers