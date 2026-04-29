const PHASE_MULTITENANCY = {
  name:"Phase 17 · Multi-Tenancy",id:"tenant",icon:"🏢",phase:"Multi-tenancy",color:"#06b6d4",
  sizes:["small","medium","large","hyper"],
  short:"Pooled → siloed → cell-per-tier · noisy-neighbor isolation",
  detail:{what:"How a SaaS isolates one customer's data, performance, and failures from another's. Foundational to B2B architecture.",
    why:"Wrong tenancy model = a single big customer's bad query takes down all customers. Or compliance failure (one tenant sees another's data). Or unbounded blast radius on bugs.",
    numbers:"Cost: pooled is 5–20× cheaper per tenant than siloed at small tenant size. Crossover: silo when tenants are >$10K MRR each or have compliance demands."},
  tradeoffs:[
    {axis:"Tenant isolation model",left:"Pooled shared infra: cheapest, noisy-neighbor and blast-radius risk",right:"Siloed dedicated infra per tenant: full isolation, ~5–10× per-tenant cost"},
    {axis:"Deployment topology",left:"Single deploy serving all tenants: one upgrade for everyone, no variants",right:"Per-tenant deploy: each tenant on its own version/config, N× ops surface"}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"First enterprise/regulated customer or noisy-neighbor incident",action:"Add tenant_id everywhere. Row-level security. Per-tenant rate limits."},
    {from:"medium",to:"large",trigger:">100 enterprise tenants or first compliance audit",action:"Tier-based pools (free/pro/enterprise pools). Schema-per-tenant for top tier. Per-tenant observability."},
    {from:"large",to:"hyper",trigger:">1000 large tenants or geo data residency required",action:"Cell architecture: each cell hosts N tenants with full stack. Per-region data residency. Tenant-aware routing."}
  ],
  children:[
    {name:"Isolation Model",id:"tenant-iso",icon:"🚧",phase:"Multi-tenancy",color:"#06b6d4",
     sizes:["small","medium","large","hyper"],short:"Shared row → shared schema → DB-per-tenant → cell",
     detail:{what:"The level at which one tenant's resources are physically and logically separated from another's.",
       why:"Each level adds isolation but costs more. Map tenant tiers to isolation levels: free=row, pro=schema, enterprise=cell.",
       numbers:"Pooled DB: $0.001/tenant/mo at 10K tenants. Schema-per-tenant: $0.10. DB-per-tenant: $50+. Cell: $500+. Match cost to ARR."},
     tradeoffs:[
       {axis:"Tenant data topology",left:"Shared DB with tenant_id columns: cheap, one schema migration for all, one bad query hits everyone",right:"DB per tenant: clean blast-radius boundary, hundreds of DBs to backup and migrate"}
     ],
     sizes_cfg:{
       small:{range:"Pooled (shared everything)",rec:"tenant_id column on every table. App-level enforcement OR Postgres RLS (row-level security). One DB, one schema. Cheap and simple.",tools:["Postgres RLS","tenant_id pattern","ActsAsTenant (Rails)"]},
       medium:{range:"Pooled with schema-per-tenant for top tier",rec:"Default: pooled with RLS. Top-tier customers: dedicated schema (e.g. tenant_42.users). Same DB instance still. Easy migration path to silo.",tools:["Postgres schemas","apartment (Rails)","django-tenants"]},
       large:{range:"Tier-based pools + DB-per-tenant for enterprise",rec:"Free/pro tenants share pools (1000s per pool). Enterprise gets dedicated DB. Routing layer: tenant_id → connection string. Tenant migration playbook (pool → silo).",tools:["Citus per-tenant sharding","ProxySQL","custom router","Vitess keyspaces"]},
       hyper:{range:"Cell architecture",rec:"Each cell = independent stack (DB + compute + cache) hosting N tenants. Cells have geographic affinity for data residency. Tenant onboarding picks cell by region + load. Failure in one cell affects only ~1% of tenants.",tools:["AWS cell architecture pattern","Salesforce 'pods'","Slack 'shards'","custom cell controller"]}
     },
     levelUp:[],
     pitfalls:[
       {name:"Forgetting tenant_id in one query",desc:"Cross-tenant data leak. The classic SaaS bug. Use ORM tenant scoping or RLS, never raw SQL without scope."},
       {name:"Noisy neighbor on pooled cache",desc:"One tenant's bulk import evicts everyone's hot data from Redis. Use per-tenant cache namespaces with quotas."},
       {name:"Migration migration",desc:"Schema migration on a 10K-schema DB takes hours and locks each schema in turn. Use online migrations (gh-ost) and per-tenant async."}
     ],
     examples:[
       {name:"Salesforce pods",desc:"Each 'pod' hosts ~10K orgs with full stack copy. ~100 pods globally. Outages contained per pod."},
       {name:"Slack shards",desc:"Each workspace pinned to a shard. Shard = MySQL + Redis + workers. Move workspace between shards via async migration."}
     ],
     related:[{id:"shard-key",label:"Shard Keys"},{id:"reliability",label:"Reliability"}],
     children:[]},

    {name:"Noisy Neighbor",id:"tenant-noise",icon:"🔊",phase:"Multi-tenancy",color:"#06b6d4",
     sizes:["medium","large","hyper"],short:"Per-tenant quotas, fair queueing, isolation",
     detail:{what:"Mechanisms that prevent one tenant's heavy usage from degrading other tenants' performance in a shared system.",
       why:"Without isolation, your largest customer's batch job becomes everyone else's outage. The 'noisy neighbor' is the #1 complaint in pooled SaaS.",
       numbers:"Cost-of-good-tenants: a single 99th percentile tenant can consume 50%+ of shared resources. Quotas at p99×3 of normal usage."},
     tradeoffs:[
       {axis:"Per-tenant quotas",left:"Hard quotas enforced: one tenant can't starve others, occasional 429s for legit bursts",right:"Best-effort sharing: legitimate bursts always served, one runaway tenant degrades everyone"}
     ],
     sizes_cfg:{
       medium:{range:"Basic per-tenant rate limits",rec:"API rate limits per tenant. DB query timeout per request. Connection pool partitioning by tenant tier.",tools:["Postgres statement_timeout","PgBouncer per-pool","API gateway quotas"]},
       large:{range:"Fair queueing + tier-based SLOs",rec:"Weighted fair queueing for background jobs. Per-tenant CPU/memory quotas in workers. Tier-based SLO targets (free=99%, pro=99.9%, ent=99.99%).",tools:["Sidekiq fair queueing","Kubernetes ResourceQuotas","priority classes"]},
       hyper:{range:"Hardware-level isolation",rec:"Per-tenant cgroups. Dedicated nodes for top tier. eBPF-based per-tenant network QoS. Predictive throttling using ML.",tools:["cgroups v2","Kubernetes RuntimeClasses","eBPF traffic shaping","custom scheduler"]}
     },
     levelUp:[],
     related:[{id:"api-rate",label:"Rate Limiting"}],
     children:[]}
  ]
};
