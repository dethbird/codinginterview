Heck yes. Here’s a tight, Meta-flavored mock set: one coding round, one systems/API design round (GraphQL-leaning), and one behavioral round—each with prompts, constraints, expected signals, and quick follow-ups. I included test scaffolds and rubrics so you can self-grade.

# 1) Coding: “Top-K Frequent Strings with Streamy Updates”

**Prompt**
You receive a stream of strings (words, tags, IDs). Support two ops:

* `add(s: string)`: ingest one string.
* `topK(k: int): string[]`: return the k most frequent strings (ties broken lexicographically).

**Constraints**

* `add` may be called millions of times; `topK` may be called frequently.
* Optimize for *amortized* time; memory must be O(U) where U = # of unique strings.
* Return results in descending frequency, then lexicographic.
* Discuss tradeoffs between *exact* vs *approximate* (Count-Min) if U is huge.

**What they’re probing**

* Hash maps, heaps, or “bucket sort” by frequency.
* Big-O reasoning:

  * HashMap<string,int> for counts: O(1) amortized per add
  * Either: (a) lazy min-heap of size k per `topK` → O(U log k) per call, or
  * (b) frequency “buckets” → O(U) per call but good constants;
  * Mention heavy-hitter sketches for scale.
* Clean code, edge cases (k=0, unseen words, huge k).

**Sketch solution (PHP 8.x)**

```php
final class TopKCounter {
    /** @var array<string,int> */
    private array $freq = [];

    public function add(string $s): void {
        $this->freq[$s] = ($this->freq[$s] ?? 0) + 1;
    }

    /** @return array<int,string> */
    public function topK(int $k): array {
        if ($k <= 0 || empty($this->freq)) return [];
        // Build min-heap of [freq, string] with custom compare.
        $heap = new class extends SplPriorityQueue {
            public function compare($p1, $p2): int {
                // Higher priority = larger freq, then smaller lex (invert for min-heap via negative)
                // But SplPriorityQueue is max-heap; we’ll push negative freq and inverse lex.
                return $p1 <=> $p2;
            }
        };
        // We’ll emulate min-heap by pushing tuple: [freq, -ordLex]
        // Simpler: keep an array and natsort after, but show heap usage:
        $minHeap = new SplPriorityQueue(); // max-heap; we store negative freq to simulate min-heap

        $minHeap->setExtractFlags(SplPriorityQueue::EXTR_DATA); // store strings
        // Keep parallel structure: we’ll store pri as [ -freq, lexOrder ]
        foreach ($this->freq as $s => $f) {
            $priority = [-$f, $s]; // PHP arrays compare lexicographically: freq then string
            if ($minHeap->count() < $k) {
                $minHeap->insert($s, $priority);
            } else {
                // Peek highest priority (i.e., worst because negative freq largest = smallest freq)
                $top = clone $minHeap;
                $top->extract(); // pops max priority
                // Compare new vs worst element
                // Unfortunately SplPriorityQueue doesn’t expose priority easily;
                // pragmatic approach: rebuild or keep a parallel structure.
                // In interviews, say you'd wrap a custom heap or keep a second map of priorities.
            }
        }
        // Simpler and clearer for interview: sort once (U log U) and slice:
        $items = [];
        foreach ($this->freq as $s => $f) {
            $items[] = [$s, $f];
        }
        // Sort by freq desc, then lex asc
        usort($items, function($a, $b) {
            [$sa, $fa] = $a; [$sb, $fb] = $b;
            if ($fa !== $fb) return $fb <=> $fa;
            return $sa <=> $sb;
        });
        return array_map(fn($x) => $x[0], array_slice($items, 0, $k));
    }
}
```

*Interview note:* you can start with the simple sort (clear, correct), then propose heap optimization for frequent `topK(k)` with large U, and finally mention Count-Min Sketch if U explodes and you can tolerate approximation.

**Target Big-O**

* Simple exact: `add` O(1); `topK` O(U log U) → acceptable if `topK` is rare.
* Heap exact: `add` O(1), `topK` O(U log k).
* Approximate heavy hitters: sublinear memory; discuss error bounds.

**Unit tests (edge-first)**

* Empty: `topK(3) = []`
* k=0
* Ties: confirm lexicographic
* Large `k` > U returns all
* Repeated `add` and interleaved `topK`

---

# 2) System/API Design: “Realtime Notes (GraphQL)”

**Prompt**
Design a GraphQL backend for a collaborative notes app (think lightweight Docs). Users can:

* Create/join a note
* Edit text (CRDT or OT not required, but ordering matters)
* See presence (cursors, “typing…”)
* Reconnect and backfill missed edits
* Moderate abuse (rate limits, size caps)

**Environment & tools**

* Service in PHP 8.x (or Hack) behind a GraphQL gateway
* Redis (pub/sub), Kafka available; Postgres primary store
* A separate websocket gateway is allowed

**What to cover (and what Meta looks for)**

1. **Schema (query/mutation/subscription)**

```graphql
type Note { id: ID!, title: String!, content: String!, version: Int! }
type Presence { userId: ID!, cursor: Int!, updatedAt: String! }

type Query {
  note(id: ID!): Note
  presence(noteId: ID!): [Presence!]!
}

input EditInput { noteId: ID!, baseVersion: Int!, delta: String! } # delta = ops JSON
type EditResult { note: Note!, applied: Boolean!, reason: String }
type Mutation {
  edit(input: EditInput!): EditResult!
  setPresence(noteId: ID!, cursor: Int!): Boolean!
}

type EditEvent { noteId: ID!, version: Int!, delta: String!, authorId: ID! }
type PresenceEvent { noteId: ID!, userId: ID!, cursor: Int!, updatedAt: String! }

type Subscription {
  noteEdits(noteId: ID!): EditEvent!
  presenceUpdates(noteId: ID!): PresenceEvent!
}
```

2. **Resolver strategy & N+1**

* Use a DataLoader per request context to batch note lookups, authors, and presence reads.
* Keep **current state** in Postgres (notes table with `id`, `content`, `version`, `updated_at`).
* Append **edit log** to Kafka for durability & replay; consumers update Postgres and push to Redis channels for fan-out.

3. **Realtime topology**

* Clients subscribe over WebSockets → GraphQL subscription service.
* `Mutation.edit`: validate `baseVersion` against current `version`.

  * If `baseVersion` == current: apply delta, increment version, publish `EditEvent` to Redis channel `note:{id}`; also write to Kafka.
  * Else: return `applied=false` with reason “out_of_date”; client refetches note or performs soft-merge.
* Presence writes go to Redis with TTL (e.g., 10s) → subscription service polls/receives keyspace notifications and emits `PresenceEvent`.

4. **Ordering & idempotency**

* Use a monotonically increasing `version` per note; edits carry `baseVersion`.
* Idempotent by `edit_id` UUID; store a dedupe table `note_edit(id, note_id, version, hash)` to ignore repeats on retry.

5. **Backfill on reconnect**

* Client sends `lastSeenVersion`; server fetches `edit_log` (Kafka compacted topic or Postgres `note_edits`) range `(lastSeenVersion, current]`.
* If the range is too large or compacted past, fall back to “send current snapshot (content, version)” with a “resume from snapshot” marker.

6. **Query cost & abuse controls**

* Depth & node count limits (e.g., 8 levels, 10k nodes/request).
* Complexity weights: `noteEdits` subscription limited per user/note; presence updates rate-limited (token bucket).
* Payload caps: delta size limit; reject oversized edits.
* Row-level authZ: only collaborators can subscribe/edit (check in the resolver).

7. **Pagination**

* For `edit_log(noteId)` use cursor-based pagination: `(version, noteId)` as the seek key.
* “Use LIMIT with seek cursors; cap first” → explain you prefer **seek** over **OFFSET** to avoid O(n) scan.

8. **Caching plan**

* Hot notes cached in Redis (`note:{id}:v{version}`) with short TTL; invalidate on edit.
* Field-level caching of `presence` list in Redis; expire by TTL.

**Signals interviewers want**

* Clear separation of *source of truth* (Postgres) vs *fan-out* (Redis) vs *durable log* (Kafka).
* Concrete limits, SLOs, and fallbacks.
* Conscious tradeoffs (exact ordering vs availability under partition).
* A story for migrations and schema evolution (GraphQL deprecations, additive changes).

**Lightning follow-ups**

* Multi-region: Kafka regional clusters + MirrorMaker; pin a note to a home region to avoid cross-region write contention; global read replicas for snapshots.
* Cost: idle WS timeouts; batch presence; compress deltas; collapse noisy clients with server-side coalescing.
* Security: per-note ACLs; signed subscribe tokens; WAF on HTTP upgrade path.

---

# 3) Behavioral: “Move Fast Without Breaking Users”

**Prompt**
Tell me about a time you shipped a risky backend change under time pressure. How did you de-risk it, roll it out, and validate impact?

**What to hit (STAR, but concise)**

* **Situation:** real customer or high-visibility internal use.
* **Task:** you owned a risky change (e.g., swapping a cache layer, schema change affecting GraphQL field).
* **Actions:** feature flags, shadow traffic, canary + automatic rollback, dashboards + SLOs, load tests, coordinated client releases.
* **Results:** concrete metrics (p95 latency, error rate, cache hit rate), a learning (postmortem or runbook update), and how you simplified the next time.

**Follow-ups they may ask**

* “What would you do differently?”
* “How did you handle a teammate who disagreed with your plan?”
* “How did you quantify success?”
* “How did you communicate the risk to non-experts?”

---

## Rapid-fire warmups (you should have crisp 60-second answers)

* Big-O of building a Trie and querying prefixes; when is it better than hashing?
* GraphQL N+1: show a before/after with DataLoader batching.
* Cursor vs OFFSET pagination tradeoffs and the exact DB index you’d use.
* PHP 8.x: union vs intersection types; errors vs exceptions strategy; Fibers vs Generators.
* Federation vs schema stitching: how ownership and boundary enforcement differ.
* Backpressure on subscriptions: how you’d drop/slow noisy clients.

---

## Self-grading rubric (how to judge your practice)

* **Correctness:** passes edge cases you identify out loud.
* **Complexity talk:** you say Big-O *and* when/why it matters in practice.
* **Tradeoffs:** you volunteer alternatives and where each wins.
* **Signals of ownership:** you mention testing, observability, rollout, and oncall empathy.
* **Clarity:** you narrate as you go; diagram verbally; avoid magic words.

---

## Bonus: tiny PHPUnit harness for the coding round

```php
use PHPUnit\Framework\TestCase;

final class TopKCounterTest extends TestCase {
    public function testEmpty(): void {
        $c = new TopKCounter();
        $this->assertSame([], $c->topK(3));
    }

    public function testBasics(): void {
        $c = new TopKCounter();
        foreach (['a','b','a','c','b','a'] as $s) $c->add($s);
        $this->assertSame(['a','b','c'], $c->topK(3));
        $this->assertSame(['a','b'], $c->topK(2));
    }

    public function testTiesLexOrder(): void {
        $c = new TopKCounter();
        foreach (['aa','ab','ab','aa','ac'] as $s) $c->add($s);
        // aa:2, ab:2, ac:1 → tie between aa and ab -> lex asc
        $this->assertSame(['aa','ab'], $c->topK(2));
    }

    public function testLargeK(): void {
        $c = new TopKCounter();
        foreach (['x','y','z'] as $s) $c->add($s);
        $this->assertSame(['x','y','z'], $c->topK(10));
    }
}
```

If you want, I can play “interviewer” and we can run one full dry-run: I’ll timebox the coding round to 30 minutes, then do a 35-minute design dive, then 15 minutes behavioral with follow-ups, and I’ll score you against the rubric.
