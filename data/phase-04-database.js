const PHASE_DATABASE = {
  name:"Phase 4 · Database",id:"db",icon:"🗄️",phase:"Database",color:"#0891b2",
  sizes:["small","medium","large","hyper"],
  short:"Primary store selection + secondary stores",
  detail:{
    what:"The database layer covers the storage systems holding your application's state: the primary transactional store (where source-of-truth data lives), caches (hot data in memory for fast reads), and search indexes (purpose-built for text search, faceting, ranking). Most non-trivial systems end up with several of these specialized stores rather than one database doing everything.",
    why:"Database is the most consequential and least reversible decision in system design. Application code can be rewritten in months; data migrations take 6–18 months and have non-zero data-loss risk. Choosing the wrong primary store can cap your scale or your features. Choosing the wrong secondary store wastes ops effort. The right answer depends on access pattern, not popularity — Postgres (PostgreSQL) is famously underrated for being correct in 90% of cases; MongoDB and Cassandra are famously overused for the wrong reasons.",
    numbers:"Decision factors: RPS (reads vs writes), record size, query complexity, consistency needs, schema flexibility, team familiarity. Rough scale ceilings: Postgres (PostgreSQL) single node ~50K writes/sec; with replicas ~200K reads/sec; sharded Postgres (PostgreSQL) ~1M writes/sec. Cassandra: 100K–1M writes/sec out of the box. DynamoDB: effectively unlimited with right key design. Don't shard or distribute until you've exhausted the simpler tier — every step up costs 5–10× more in ops effort."
  },
  tradeoffs:[
    {axis:"Schema vs query power",left:"NoSQL document/KV: schemaless, fast to evolve, denormalize and pre-join for queries",right:"SQL relational: strict schema, joins, aggregates, declarative queries, refactors are migrations"},
    {axis:"Scale ceiling vs ACID guarantees",left:"Distributed NoSQL (Cassandra, DynamoDB): petabyte scale, eventual consistency, no cross-shard transactions",right:"Single-node SQL (Postgres, MySQL): ACID transactions, ceiling around 10–100TB and 50K writes/s"}
  ],
  pitfalls:[
    {name:"Choosing NoSQL because 'it scales'",desc:"You picked Mongo because Mongo is webscale. Six months in, your data has relationships you didn't anticipate, and you're hand-rolling joins in application code. Postgres (PostgreSQL) handles 99% of small/medium workloads — start there unless you have a specific reason not to."},
    {name:"Storing files in the database",desc:"Avatars, PDFs, video thumbnails as BLOBs in Postgres (PostgreSQL). Bloats backups, kills query performance, costs 10× S3 prices. File data goes in object storage; DB stores the URL."},
    {name:"No connection pooler",desc:"App opens 100 connections per instance × 50 instances = 5000 DB connections. Postgres (PostgreSQL) dies at ~500. Use PgBouncer or your DB's built-in pooling. Connection limits are real."},
    {name:"Caching as the first optimization",desc:"DB is slow → add Redis cache. But the slow query is slow because of a missing index. Now you have a cache layer + an unindexed query + cache invalidation bugs. Always: optimize the DB first (indexes, query plans). Cache last."},
    {name:"No query timeouts",desc:"A pathological query runs for 30 minutes, holding a row lock. Other queries pile up. Outage. Always: statement_timeout (Postgres (PostgreSQL)) or equivalent. 5–30s is reasonable for OLTP (Online Transaction Processing) queries."}
  ],
  examples:[
    {name:"Figma's Postgres (PostgreSQL) on a single node, until it wasn't",desc:"Ran on one Postgres (PostgreSQL) instance for years past where conventional wisdom said to shard. Eventually built their own sharding layer. Demonstrates: vertical scaling goes very far, and when it stops being enough, custom sharding can be the right answer."},
    {name:"Discord's Cassandra → ScyllaDB",desc:"Originally Cassandra for trillions of messages; migrated to ScyllaDB for ~3× per-node performance at lower cost. Demonstrates that the same data model can be served by different engines, and migrations are possible (though hard)."},
    {name:"Stack Overflow on a single Postgres (PostgreSQL) + caching",desc:"Famously runs the entire site on a few SQL Server instances + aggressive caching. Counterpoint to the assumption that scale requires distributed databases. Caching + read replicas + indexing get you very far."}
  ],
  levelUp:[],
  children:[
    {name:"Primary Store",id:"db-primary",icon:"💾",phase:"Database",color:"#0891b2",
     sizes:["small","medium","large","hyper"],short:"SQL vs NoSQL — choose per access pattern",
     detail:{
       what:"The transactional, source-of-truth database. The system that, if you lost it without backup, would end the company. SQL (Postgres (PostgreSQL), MySQL): row-oriented, ACID transactions, joins, mature tooling. NoSQL document (MongoDB, DynamoDB): flexible schema, key-value or document access, easier horizontal scale. Wide-column (Cassandra, ScyllaDB): write-optimized for time-series and high-throughput. NewSQL (CockroachDB, TiDB, Spanner): SQL semantics with horizontal scale.",
       why:"Pick based on access pattern, not buzzwords. Most applications have relational data: users have many orders, orders have many items, items have many reviews. SQL is the right answer. If your data is genuinely document-shaped (varying fields, no joins) or massively write-heavy time-series, NoSQL fits. The cost of a wrong choice is paid for years.",
       numbers:"Rough ceilings before sharding: Postgres (PostgreSQL) ~50K TPS (Transactions Per Second) on tuned hardware (~16-core, NVMe), ~500GB before maintenance gets painful. MySQL similar. Cassandra: each node handles ~10K writes/sec; clusters scale linearly to 1M+. DynamoDB: unlimited if partition key is well-designed; expensive at high scale ($0.25/M writes)."
     },
     tradeoffs:[
       {axis:"Data shape",left:"Relational tables: foreign keys, joins, ACID transactions, schema migrations on change",right:"Documents / wide-column: denormalized, embedded, scales horizontally, no joins"},
       {axis:"Ops effort vs scale ceiling",left:"Managed Postgres/MySQL (RDS, Cloud SQL): low ops, ceiling ~10TB and 100K writes/s",right:"Self-run Cassandra/HBase: heavy ops investment, scales to PB and millions of writes/s"}
     ],
     pitfalls:[
       {name:"Premature sharding",desc:"You shard at 10K RPS because you read it would scale better. Now you've taken on 5× the operational complexity for no benefit. Vertically scale + read replicas first; shard only when forced to."},
       {name:"Joins across NoSQL collections",desc:"Document stores don't do joins efficiently. You end up with N+1 queries in application code. If you need joins, use SQL."},
       {name:"Schema-less means schema-anywhere",desc:"MongoDB lets you skip schema design — for a while. Eventually you have 5 different shapes of 'user' documents from 5 years of code, and queries are unpredictable. Define and enforce schema even on schema-less DBs."},
       {name:"Forgetting the slow query log",desc:"Production gets slow at peak. You don't know which query is the problem. Always enable slow query logging from day 1; review weekly."}
     ],
     examples:[
       {name:"Notion on Postgres (PostgreSQL) at billions of blocks",desc:"Notion stores all blocks in Postgres (PostgreSQL), sharded by workspace. Demonstrates Postgres (PostgreSQL) scales much further than skeptics claim, with disciplined sharding."},
       {name:"DynamoDB at Amazon scale",desc:"Origin: relational DBs were the bottleneck for Amazon's shopping cart at peak. Built Dynamo (paper, 2007) for unlimited horizontal scale with explicit eventual consistency. Demonstrates the right scenario for NoSQL: extreme write throughput, simple key access patterns."}
     ],
     sizes_cfg:{
       small:{range:"<10K RPS, <100GB, structured data",rec:"PostgreSQL. Period. It handles 99% of small-scale workloads. Use managed: RDS, Cloud SQL, Railway, Supabase. Don't use MongoDB at small scale unless your data is genuinely unstructured.",tools:["PostgreSQL","MySQL 8","SQLite (for <100GB)","Supabase","PlanetScale"]},
       medium:{range:"10K–100K RPS, 100GB–10TB",rec:"PostgreSQL with read replicas for read-heavy. Aurora for managed scalability. Consider MongoDB if truly schema-flexible. Use connection pooling (PgBouncer). Vertical scaling first.",tools:["AWS Aurora","PostgreSQL + PgBouncer","MongoDB Atlas","CockroachDB (if need geo)"]},
       large:{range:"100K–500K RPS or >10TB",rec:"Shard PostgreSQL (Citus) OR move write-heavy workloads to Cassandra/DynamoDB. Keep relational for complex queries, switch to wide-column for time-series or key-value heavy workloads. Multi-store architecture.",tools:["Citus (sharded Postgres (PostgreSQL))","Cassandra","DynamoDB","TiDB","Vitess (sharded MySQL)"]},
       hyper:{range:">500K RPS or >1PB or global strong consistency",rec:"Google Spanner for globally consistent relational. DynamoDB + Global Tables for globally available KV. Cassandra for write-heavy time-series. Multiple engines for different workloads.",tools:["Google Spanner","DynamoDB Global Tables","Cassandra (DataStax)","custom storage engines"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Single DB CPU >70% sustained or disk >500GB",action:"Add read replica. Vertical scale. Enable PgBouncer connection pooling. Audit slow queries."},
       {from:"medium",to:"large",trigger:">100K writes/sec or disk >5TB or single server limits",action:"Shard (Citus or Vitess) OR introduce Cassandra for write-heavy workloads."},
       {from:"large",to:"hyper",trigger:"Global consistency required OR >500K TPS (Transactions Per Second)",action:"Google Spanner for strong global. DynamoDB Global Tables for AP. Custom tiered storage."}
     ],
     children:[]},

    {name:"Caching Layer",id:"db-cache",icon:"⚡",phase:"Database",color:"#0891b2",
     sizes:["small","medium","large","hyper"],short:"None → Redis → Cluster → Multi-tier (L1/L2/CDN)",
     detail:{
       what:"A fast in-memory store (typically Redis or Memcached) that holds frequently-read data, returning it without hitting the database. Patterns: cache-aside (app reads cache; on miss, reads DB and populates cache), read-through (cache itself fetches from DB), write-through (writes go to cache and DB), TTL-based expiry, explicit invalidation.",
       why:"Reading from a cache is 50–500× faster than reading from a database (0.1ms vs 5–50ms). If 90% of reads can be served from cache, you've removed 90% of the DB load — the difference between needing 5 DB nodes and needing 50. Cache also handles the 'hot key' problem: when 1M users read the same record, the cache absorbs it; the DB never sees the storm.",
       numbers:"Target hit rate: >80% on hot data, ideally >95%. Below 80% the cache is barely earning its complexity. Memory sizing: cache should hold the working set (the 20% of data accessed 80% of the time), not all data. TTL: minutes for fresh-ish data, hours for stable, never for derived/computed data without explicit invalidation. Cost: ElastiCache Redis ~$0.05/GB-hour ≈ $36/GB/month."
     },
     tradeoffs:[
       {axis:"Cache TTL",left:"Long TTL (hours): high hit rate, users see stale data until eviction",right:"Short TTL (seconds): fresh data, much higher origin DB load on misses"},
       {axis:"Cache topology",left:"L1 in-process (per-instance map): sub-µs reads, every instance has its own copy and warms it independently",right:"L2 distributed (Redis, Memcached): shared across instances, consistent invalidation, +1ms network per read"}
     ],
     pitfalls:[
       {name:"Cache stampede / thundering herd",desc:"A popular key expires; 10K concurrent requests all miss → all hit DB simultaneously → DB melts. Mitigations: probabilistic early refresh (refresh slightly before expiry), single-flight pattern (only one request rebuilds, others wait), staggered TTLs (jitter)."},
       {name:"Caching everything",desc:"If you cache rarely-read data, you spend memory for no gain. Cache only what's actually hot — measure with access frequency, not assumption."},
       {name:"No invalidation strategy",desc:"You write to DB but forget to invalidate cache → stale data for hours/days. Decide upfront: TTL-based (accept staleness), explicit invalidate on write, or write-through. Pick one and stick with it."},
       {name:"Cache as source of truth",desc:"You forgot to update DB; cache has the only copy of the data. Cache evicts/restarts → data lost. Cache is always derived data; DB is truth."},
       {name:"Serializing complex objects",desc:"You cache a serialized 5MB object. Each cache hit deserializes 5MB. Cache the small/atomic values; recompose in app."}
     ],
     examples:[
       {name:"Twitter timeline cache",desc:"Each user's home timeline is precomputed and cached in Redis. Reads are O(1) cache hit. The cache is the entire architecture for read scale. Cache miss = expensive timeline assembly."},
       {name:"Facebook's TAO and memcached at scale",desc:"Famously massive memcached deployment: thousands of memcached servers backing Facebook's social graph. Multiple papers describing the cache invalidation strategies needed at scale. Demonstrates that cache is core architecture, not an afterthought."}
     ],
     sizes_cfg:{
       small:{range:"No cache needed, or simple in-process",rec:"Start without cache. Add only when DB is the bottleneck. If you add cache, use a single Redis instance. Cache invalidation adds complexity — don't add it prematurely.",tools:["Redis single node","Memcached","in-process LRU (e.g. python-lru-cache)"]},
       medium:{range:"Single Redis instance, key-value cache",rec:"Redis for session storage, hot DB rows, computed values. TTL-based invalidation. Cache aside pattern. Monitor hit rate in Datadog.",tools:["Redis 7","ElastiCache (managed)","ioredis","Dragonfly DB"]},
       large:{range:"Redis Cluster, cache stampede prevention",rec:"Redis Cluster (multiple shards). Read-through cache pattern. Probabilistic cache refresh (avoid thundering herd). Separate Redis instances per use case (sessions, hot data, rate limiting).",tools:["Redis Cluster","Twemproxy","Envoy L7","cache stampede: jitter + lock"]},
       hyper:{range:"Multi-tier: L1 (in-process) + L2 (Redis) + L3 (CDN)",rec:"L1: per-process in-memory LRU (fastest, ~10μs). L2: Redis Cluster (shared, ~0.5ms). L3: CDN for HTTP-level caching (edge, ~0ms). Write invalidation cascades all tiers.",tools:["Caffeine (Java L1)","Redis Cluster (L2)","Varnish/CDN (L3)","custom invalidation bus"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"DB read latency >100ms or DB CPU >60%",action:"Add Redis. Cache hot queries (cache-aside). Monitor hit rate. Start with 30-min TTL."},
       {from:"medium",to:"large",trigger:"Single Redis >80% memory or cache stampede incidents",action:"Redis Cluster. Cache stampede prevention. Per-use-case Redis instances."},
       {from:"large",to:"hyper",trigger:"Redis Cluster latency >5ms or cache complexity unmanageable",action:"Multi-tier L1+L2+L3. CDN for HTTP responses. Custom invalidation."}
     ],
     children:[]},

    {name:"Search Layer",id:"db-search",icon:"🔍",phase:"Database",color:"#0891b2",
     sizes:["small","medium","large","hyper"],short:"DB LIKE → Postgres (PostgreSQL) FTS → Elasticsearch (search and analytics engine) → custom",
     detail:{
       what:"A specialized index optimized for full-text search, fuzzy matching, faceted filtering, relevance ranking, and autocomplete. Built around inverted indexes (word → list of documents containing it) rather than the B-trees of OLTP (Online Transaction Processing) databases.",
       why:"SQL LIKE '%foo%' does a full table scan and can't handle relevance, typos, stemming, or facets. Search engines (Elasticsearch (search and analytics engine), OpenSearch, Typesense) are 100–1000× faster on these workloads and offer features SQL fundamentally can't (BM25 ranking, fuzzy match, geo-spatial). They're also operationally heavier than a plain DB — only adopt when search is a real product feature.",
       numbers:"Postgres (PostgreSQL) full-text search: works well up to ~5M documents. Elasticsearch (search and analytics engine) cluster: 10K–100K queries/sec depending on complexity, indexing rate 10K–100K docs/sec. Latency: 10–50ms for typical queries on 10M+ documents. Shard sizing: 20–40GB per shard is the sweet spot."
     },
     tradeoffs:[
       {axis:"Search engine",left:"Postgres FTS (Full-Text Search): no extra infra, good for <1M docs and basic ranking",right:"Elasticsearch / OpenSearch: faceting, fuzzy matching, BM25, separate cluster to operate"},
       {axis:"Index freshness",left:"Synchronous indexing in the write path: writes block until index updates, search is always fresh",right:"Asynchronous indexing pipeline: higher write throughput, search lags by seconds to minutes"}
     ],
     pitfalls:[
       {name:"Search index as primary store",desc:"Elasticsearch (search and analytics engine) is durable in practice but designed for derived data. Treat it as a cache of search-shaped data, not source of truth. The DB is the truth; ES is the index."},
       {name:"Synchronous indexing in the write path",desc:"Every write to DB synchronously writes to ES. ES is slower and flakier; your writes inherit that. Use async indexing (CDC + queue) — accept brief search staleness."},
       {name:"Reindexing causes outages",desc:"Schema change requires reindexing 100M docs; takes 6 hours during which search is broken. Use blue-green indexing: build new index alongside, swap when ready."},
       {name:"Too many shards",desc:"Each shard has fixed overhead. You created 100 shards for 10M docs. Cluster overhead dominates query time. Aim for ~30GB/shard, not 1GB/shard."}
     ],
     examples:[
       {name:"GitHub code search",desc:"Famously rebuilt their code search on a custom engine (Blackbird) because Elasticsearch (search and analytics engine) couldn't handle code-shaped queries (regex, identifier search) at GitHub's repo scale. Demonstrates: at extreme scale and unusual access patterns, off-the-shelf may not be enough."},
       {name:"Algolia for SaaS search",desc:"Many SaaS companies use Algolia rather than running ES because the operational burden of self-hosted ES is significant. Trade-off: managed = expensive ($/M queries), self-hosted = ops overhead."}
     ],
     sizes_cfg:{
       small:{range:"<100K records, simple search",rec:"Use Postgres (PostgreSQL) full-text search (tsvector/tsquery). It's surprisingly capable and avoids the ops overhead of a separate search cluster.",tools:["Postgres (PostgreSQL) FTS","pg_trgm for fuzzy","SQLite FTS5"]},
       medium:{range:"100K–10M records, relevance ranking needed",rec:"Postgres (PostgreSQL) FTS with GIN indexes for up to ~5M records. Beyond that or if you need facets/autocomplete: Elasticsearch (search and analytics engine) or Typesense (simpler ops).",tools:["Elasticsearch (search and analytics engine)","Typesense","Meilisearch","OpenSearch"]},
       large:{range:"10M–1B records, complex queries",rec:"Elasticsearch (search and analytics engine) cluster (3–9 nodes). Separate indexing pipeline from query path. Use Logstash/Kafka for async indexing. Tune shards: 1 shard per 20–40GB.",tools:["Elasticsearch (search and analytics engine) 8","OpenSearch","Kafka for index pipeline","Logstash"]},
       hyper:{range:">1B records, sub-10ms latency, global",rec:"Custom search built on inverted index + distributed infrastructure. Multi-layer: recall (inverted index) → ranking (ML model) → serving. Google-style architecture.",tools:["Custom Lucene-based","Vespa","Solr","custom ML ranking","Faiss for vector search"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">1M records or relevance ranking needed",action:"Add Elasticsearch (search and analytics engine) or Typesense. Async indexing pipeline."},
       {from:"medium",to:"large",trigger:">10M records or search p99 >200ms",action:"Elasticsearch (search and analytics engine) cluster. Tune shards. Separate index from query nodes."},
       {from:"large",to:"hyper",trigger:">1B documents or sub-10ms required",action:"Custom distributed search. ML ranking. Recall+ranking two-stage architecture."}
     ],
     children:[]}
  ]
};
