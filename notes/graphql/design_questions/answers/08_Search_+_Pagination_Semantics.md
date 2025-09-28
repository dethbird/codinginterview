# 8) Search and Pagination Semantics

Implement search across articles with filters (author, tags, date) and reliable pagination. Provide counts for facets and highlight snippets. Start in DB, optionally migrate to OpenSearch/Meilisearch later.

---

## Schema (SDL)

```graphql
scalar ISO8601

type Query {
  searchArticles(input: ArticleSearchInput!): ArticleSearchResult!
}

input ArticleSearchInput {
  q: String
  authorIds: [ID!]
  tagIds: [ID!]
  dateFrom: ISO8601
  dateTo: ISO8601
  sort: ArticleSort = PUBLISHED_DESC
  first: Int = 20
  after: String
}

enum ArticleSort { PUBLISHED_DESC PUBLISHED_ASC SCORE_DESC }

type ArticleSearchResult {
  connection: ArticleConnection!
  facets: ArticleFacets!
}

type ArticleConnection { edges: [ArticleEdge!]!, pageInfo: PageInfo!, totalCount: Int }
type ArticleEdge { node: Article!, cursor: String! }
type Article { id: ID!, title: String!, body: String!, author: Author!, publishedAt: ISO8601!, snippet: String }
type Author { id: ID!, name: String! }
type ArticleFacets { tagCounts: [TagCount!]!, authorCounts: [AuthorCount!]! }
type TagCount { tagId: ID!, count: Int! }
type AuthorCount { authorId: ID!, count: Int! }
type PageInfo { hasNextPage: Boolean!, endCursor: String }
```

---

## DB First

Full text search column:
```sql
ALTER TABLE articles ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS ( setweight(to_tsvector('simple', coalesce(title,'')), 'A')
                      || setweight(to_tsvector('simple', coalesce(body ,'')), 'B')
                      ) STORED;
CREATE INDEX articles_tsv ON articles USING gin(tsv);
CREATE INDEX articles_pub ON articles (published_at DESC, id DESC);
```

Seek cursor for PUBLISHED_DESC uses key (published_at DESC, id DESC). Cursor is base64 of those keys.

Facets are computed with the same filters without pagination; cache for 2-5 minutes.

Snippets use ts_headline in Postgres, or engine highlighting when externalized.

---

## External Engine

Keep the GraphQL contract. When routing to OpenSearch or Meilisearch, ensure deterministic sort and cursor like (score DESC, published_at DESC, id DESC). totalCount may be approximate; surface an extensions.approximate flag if needed.

---

## Caching and Limits

- Cache search pages by normalized input (TTL 30-120s).  
- Cache facets longer (120-300s).  
- Cap first to a reasonable number (<= 50) and overall window to avoid deep scroll costs.
- Null vs empty list semantics: null means no filter; empty list means match none.
