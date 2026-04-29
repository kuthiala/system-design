const PHASE_MIGRATIONS = {
  name:"Phase 21 · Migrations & Evolution",id:"migrate",icon:"🚚",phase:"Migrations",color:"#facc15",
  sizes:["small","medium","large","hyper"],
  short:"Schema · datastore · service extraction · zero-downtime",
  detail:{what:"The patterns and processes for evolving your live system without downtime: schema changes, datastore swaps, service extractions, large-scale backfills.",
    why:"Every successful system needs to evolve. The migration capability is the limiting factor on architectural improvements. Without it, you're stuck with day-1 decisions forever.",
    numbers:"Online schema migrations (gh-ost, pt-osc): minutes to hours for billion-row tables, near-zero lock time. Datastore migrations: 6–18 month projects for >100GB."},
  tradeoffs:[
    {axis:"Migration strategy",left:"Big-bang cutover: one weekend, simple plan, full rollback if it fails",right:"Expand-contract over weeks: zero-downtime, dual-state code in flight"},
    {axis:"Schema change pattern",left:"Dual-write to old + new: safe rollback, complex code, drift if unmonitored",right:"Hard cutover at flag flip: minimal code, can't roll back data once new schema is written"}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"First migration that needs >5min downtime",action:"Adopt expand-contract pattern. Online migration tool. Backfill jobs idempotent."},
    {from:"medium",to:"large",trigger:"First datastore swap or >1B row table",action:"Dual-write infra. Shadow read for verification. Gradual traffic shift with metrics."},
    {from:"large",to:"hyper",trigger:"Continuous datastore evolution as business need",action:"Migration framework as platform capability. Automated dual-write/dual-read. Zero-downtime as default."}
  ],
  children:[
    {name:"Schema Evolution",id:"mig-schema",icon:"📐",phase:"Migrations",color:"#facc15",
     sizes:["small","medium","large","hyper"],short:"Expand-contract · online DDL · forward-only",
     detail:{what:"Pattern for changing database schema without breaking running code or requiring downtime.",
       why:"App and DB deploy at different times. A schema change that requires synchronized deploy is a recipe for outages.",
       numbers:"Expand-contract phases: 1) Add new (additive only), 2) Dual-write old+new, 3) Backfill, 4) Switch reads to new, 5) Stop writing old, 6) Drop old. Each phase deployable independently."},
     tradeoffs:[
       {axis:"Rollout granularity",left:"6 sequential deploys (add, dual-write, backfill, switch reads, switch writes, drop): safe at every step",right:"Single deploy with full change: fast if it works, painful rollback when it doesn't"}
     ],
     sizes_cfg:{
       small:{range:"Direct migrations OK at low traffic",rec:"Use ORM migrations (Rails/Django/Prisma). Avoid renames (drop+add). Always additive in same release.",tools:["Rails migrations","Alembic","Flyway","Prisma Migrate"]},
       medium:{range:"Online tools for large tables",rec:"Use gh-ost (MySQL) or pg_repack/pg_squeeze (Postgres) for tables >10M rows. Always expand-contract for column drops.",tools:["gh-ost","pt-online-schema-change","pg_repack","Square's shift"]},
       large:{range:"Strict expand-contract + automation",rec:"All migrations expand-contract. Automated backfill jobs with rate limiting. Schema linter in CI (no rename, no drop without contraction).",tools:["Atlas (schema as code)","Skeema","Liquibase","custom linter"]},
       hyper:{range:"Migration platform as service",rec:"Self-service platform: declare desired schema, system handles expand-contract orchestration. Backfill on dedicated infra. Per-shard rollout.",tools:["Custom migration platform","Vitess online schema changes","CockroachDB online schema"]}
     },
     levelUp:[],
     formulas:[
       {name:"Backfill duration",expr:"hours = total_rows / (write_rate × replication_headroom)",note:"replication_headroom = (max_replication_writes_per_sec - normal_writes_per_sec). Often 30-50% of capacity."}
     ],
     pitfalls:[
       {name:"NOT NULL on add",desc:"Adding a NOT NULL column to a 1B-row table locks for hours. Always: add nullable → backfill → add NOT NULL constraint separately."},
       {name:"Forgetting to backfill",desc:"New column added, code reads it expecting non-null. Old rows return NULL. Always backfill before reading."},
       {name:"Replication lag during backfill",desc:"Backfill writes saturate replication, replicas fall hours behind. Throttle backfill to <30% of write capacity."}
     ],
     related:[{id:"db-primary",label:"Primary Store"}],
     children:[]},

    {name:"Datastore Migration",id:"mig-store",icon:"🔄",phase:"Migrations",color:"#facc15",
     sizes:["medium","large","hyper"],short:"Dual-write · shadow-read · gradual cutover",
     detail:{what:"Moving from one datastore to another (e.g., MySQL → Cassandra, Postgres → Spanner) without downtime or data loss.",
       why:"This is the highest-stakes type of migration. Get it wrong and you lose data; do it slowly and you're stuck running two systems indefinitely.",
       numbers:"Standard playbook (Stripe-style): backfill → dual-write → dual-read with comparison → cutover → cleanup. 6–18 months for large tables."},
     tradeoffs:[
       {axis:"Cutover pacing",left:"Fast switch (minutes): low ops cost, less time to spot anomalies before commit",right:"Gradual switch over hours/days with verification queries: comprehensive checks, longer dual-write window"}
     ],
     sizes_cfg:{
       medium:{range:"Dual-write with manual cutover",rec:"App writes to both old and new. Backfill historical data. Compare reads (sample). Manual cutover after weeks of stability.",tools:["Custom dual-write","Debezium CDC","AWS DMS"]},
       large:{range:"Automated migration framework",rec:"Framework: dual-write + shadow-read + diff metrics + per-tenant cutover. Rollback at any point. Used for many migrations across the org.",tools:["Stripe-style migration framework","custom CDC pipeline","Debezium + Kafka"]},
       hyper:{range:"Online live migration as commodity",rec:"Migration is a routine operation. Self-service platform. Distributed CDC (Debezium at scale). Verifier compares 100% of reads in shadow mode.",tools:["LinkedIn Brooklin","AirBnB SpinalTap","custom platform"]}
     },
     levelUp:[],
     examples:[
       {name:"Stripe ledger migration",desc:"Migrated from MongoDB to MySQL over 18 months. Custom dual-write framework reused for many subsequent migrations."},
       {name:"Discord Cassandra → ScyllaDB",desc:"Migrated trillions of messages with custom data migrator. Dual-read for weeks before cutover."}
     ],
     related:[{id:"db-primary",label:"Primary Store"}],
     children:[]},

    {name:"Strangler Fig",id:"mig-strangler",icon:"🌿",phase:"Migrations",color:"#facc15",
     sizes:["medium","large","hyper"],short:"Incrementally replace a monolith",
     detail:{what:"A pattern for migrating from a legacy system: route specific traffic patterns to a new system, gradually 'strangling' the old until it can be removed.",
       why:"Big-bang rewrites fail (Netscape, Twitter rewrites). Strangler fig reduces risk by validating each piece in production before the next.",
       numbers:"Successful strangler migrations: 6 months to 3 years. Big-bang rewrites: 50%+ failure rate, often abandoned."},
     tradeoffs:[
       {axis:"Service rewrite pattern",left:"Big-bang rewrite: faster on paper, frequently fails on hidden integration assumptions",right:"Strangler fig (route features gradually, slowly replace): months of dual systems, much higher success rate"}
     ],
     sizes_cfg:{
       medium:{range:"Reverse proxy routes by path",rec:"Put gateway in front of monolith. New endpoints route to new service. Old paths still go to monolith. Migrate one endpoint at a time.",tools:["Nginx","Envoy","API gateway routing rules"]},
       large:{range:"Per-feature flags + parallel implementation",rec:"Feature flag controls routing. Run old + new in parallel for verification. Migrate by user cohort first, then by % of traffic.",tools:["LaunchDarkly","Envoy traffic split","Istio canary"]},
       hyper:{range:"Programmable mesh-driven migration",rec:"Service mesh routes by request properties (header, cookie, geography). A/B compare old vs new at the response level. Auto-rollback on diff.",tools:["Istio traffic policies","custom service mesh","feature flags at edge"]}
     },
     levelUp:[],
     examples:[
       {name:"Twitter ruby → scala",desc:"Strangler over 5+ years. Each service rewritten independently. Some core ruby still exists today."},
       {name:"Shopify monolith → modular",desc:"Pods pattern: extracted bounded contexts from Rails monolith into modules without crossing service boundary."}
     ],
     related:[{id:"arch-modmono",label:"Modular Monolith"}],
     children:[]}
  ]
};
