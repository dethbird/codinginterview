# 5) File Uploads + Media Pipeline

Expose GraphQL to upload images and request renditions (thumb, webp). Handle large files, virus scanning, async processing, and status updates via polling or subscriptions.

Constraints: S3-like storage; PHP API; background workers; CDN.
Challenges: upload protocol, mutation shape for async jobs, securing URLs, cache invalidation, dedupe.

---

## API Shape (SDL)

```graphql
scalar ISO8601
scalar Upload

enum RenditionKind { THUMB SMALL MEDIUM LARGE WEBP_ORIGINAL }
enum MediaStatus { PENDING UPLOADING SCANNING PROCESSING READY FAILED }

type Query {
  media(id: ID!): Media
  mediaByChecksum(sha256: String!): Media
}

type Mutation {
  createUploadRequest(input: UploadRequestInput!): UploadRequest!
  completeUpload(uploadId: ID!, checksum: String!): Media!
  requestRenditions(mediaId: ID!, kinds: [RenditionKind!]!): Job!
}

input UploadRequestInput {
  filename: String!
  contentType: String!
  sizeBytes: Int!
  checksum: String!
}

type UploadRequest {
  uploadId: ID!
  url: String!
  headers: [Header!]!
  expiresAt: ISO8601!
}

type Header { name: String!, value: String! }

type Media {
  id: ID!
  filename: String!
  contentType: String!
  sizeBytes: Int!
  checksum: String!
  status: MediaStatus!
  renditions: [Rendition!]!
  createdAt: ISO8601!
}

type Rendition {
  kind: RenditionKind!
  url: String
  width: Int
  height: Int
  sizeBytes: Int
  readyAt: ISO8601
}

type Job {
  id: ID!
  state: JobState!
  progress: Int!
  resultMediaId: ID
  updatedAt: ISO8601!
}

enum JobState { QUEUED RUNNING SUCCEEDED FAILED }
```

Notes:
- Prefer signed URL PUT for large files; only small files use multipart Upload.
- completeUpload validates object, persists Media row, enqueues VirusScan job.

---

## Storage and Pipeline

Flow:
1) Client calls createUploadRequest -> pre-signed PUT.
2) Client uploads to S3 directly.
3) Client calls completeUpload(uploadId, checksum) -> server HEADs, verifies, stores row with status=SCANNING, enqueues scan job.
4) On scan success -> enqueue transcode job to generate renditions to r/{mediaId}/{kind}.
5) Update Media to READY and emit event.

Queues and workers:
- Redis or SQS; workers idempotent using key media:{id}:stage:{name}. Max retries 3-5 with jitter.

Virus scanning:
- ClamAV or cloud AV; if failed, mark FAILED and do not expose URLs.

---

## Security and URLs
- Originals in private bucket; renditions public or private per tenant policy.
- Private access uses signed GET URLs (TTL 5-15 minutes). Public uses CDN.
- Object keys include content hash to make them immutable for CDN caching.

---

## CDN Caching and Invalidation
- Renditions are immutable -> cache forever and never overwrite. New upload => new mediaId or new hashed key.

---

## DB Schema

```sql
CREATE TABLE media (
  id           bigserial PRIMARY KEY,
  filename     text NOT NULL,
  content_type text NOT NULL,
  size_bytes   bigint NOT NULL,
  checksum     text NOT NULL,
  status       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checksum)
);

CREATE TABLE renditions (
  media_id     bigint NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  width        int,
  height       int,
  size_bytes   bigint,
  ready_at     timestamptz,
  storage_key  text NOT NULL,
  PRIMARY KEY (media_id, kind)
);

CREATE INDEX ON media (status, updated_at DESC);
```

---

## Dedupe Strategy
- Lookup by checksum before creating new uploads. Unique(checksum) prevents duplicates during races.

---

## Observability and Backpressure
- Track upload duration, scan time, transcode time, queue latency, retries.
- Cap concurrent transcodes, auto-scale workers. Optionally 429 if queue saturation is detected.

---

## Lightning Follow-ups
Retryable jobs: idempotency keys, jittered retries, dead-letter queue.
Deduping identical uploads: checksum unique plus lookup; return existing Media if found.
Access logs per tenant: record signed URL issuance, ingest CDN/S3 logs for GETs.
