const PHASE_REQUIREMENTS = {
  name:"Phase 1 · Requirements",id:"req",icon:"📋",phase:"Requirements",color:"#6b7280",
  sizes:["small","medium","large","hyper"],
  short:"Quantify everything before deciding anything",
  detail:{
    what:"The requirements phase translates vague product goals ('build a chat app') into concrete, measurable constraints ('1M DAU, p99 200ms, 99.95% uptime, $50K/mo budget, EU + US users'). It covers traffic patterns, latency targets, availability targets, consistency needs, geographic distribution, data growth, and budget. These numbers become the inputs to every architectural decision downstream.",
    why:"Every architectural choice is only correct relative to your actual workload. Postgres is right at 1K RPS and wrong at 1M RPS; Cassandra is the opposite. Without numbers, you're guessing — and guessing wrong is expensive: an over-engineered architecture wastes money and slows development for years; an under-engineered one collapses on launch day. Requirements are also the contract between engineering and product/business: they make trade-offs explicit ('99.99% costs 5× more than 99.9% — which do you want?') instead of letting them be made implicitly by whoever writes the code.",
    numbers:"Spend 20–30% of design time here. A poorly specified system gets designed twice. Key numbers to nail down before any architecture: avg & peak RPS, R/W ratio, p99 latency target, availability SLO, data size today + growth/month, geographic distribution of users, consistency requirements per feature. If any of these aren't pinned within an order of magnitude, you're not ready to start designing."
  },
  tradeoffs:[{axis:"Precision vs Speed",left:"Perfect spec → slow start",right:"Fast start → wrong design",pos:0.4}],
  pitfalls:[
    {name:"Designing for hypothetical scale",desc:"'What if we go viral and hit 100M users?' You build for that, ship in 18 months instead of 3, never reach 100K users. Design for 10× current scale, not 10000×. Re-architect when you actually need to."},
    {name:"Single SLO across all endpoints",desc:"You set 'p99 <200ms' globally. /search needs that; /export-pdf doesn't. Per-endpoint SLOs let you optimize where it matters and not waste effort where it doesn't."},
    {name:"Treating peak as average",desc:"You quote '10K RPS' which is your peak; you size for 10K constantly. Costs 5× more than you need. Conversely: sizing for average means failing at peak. Always specify avg AND peak (peak-to-avg ratio is typically 3–10×)."},
    {name:"Not asking about the read/write ratio",desc:"Same RPS number leads to opposite architectures depending on R/W. 99:1 read-heavy → cache + replicas. 1:99 write-heavy → sharding + LSM stores. Always ask."},
    {name:"Vague availability target",desc:"'It should always be up.' OK, that's 100% which is impossible. Pin it down: 99.9% (8.7h/year), 99.95% (4.4h), 99.99% (52min). Each extra nine costs 3–10× more in redundancy (99.9%→99.99% ≈ 3–5×; 99.99%→99.999% ≈ 4–10× on top of that)."}
  ],
  examples:[
    {name:"Twitter's underestimated growth",desc:"Built early architecture for 'a few thousand users' — Ruby monolith, single MySQL. Hit viral growth, suffered the 'fail whale' era for years. Lesson: get the order of magnitude right; you can't refactor your way out of a 100× miscalculation under load."},
    {name:"Discord's deliberate low-availability tier",desc:"Voice rooms target 99.9%, not 99.99%. Recognized that gamers will reconnect from a 30s blip; spending 3–5× more for one extra nine isn't worth it. Explicit SLO matched to user expectation."}
  ],
  levelUp:[],
  children:[
    {name:"Traffic & Scale",id:"req-traffic",icon:"📈",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"RPS, DAU, MAU, peak-to-avg ratio",
     detail:{
       what:"Traffic & scale are the volume metrics: requests per second (avg, p95, p99), daily/monthly active users, peak-to-average ratio, data volume today and growth rate. These quantify how big your system needs to be. RPS, p95/p99 are percentiles showing response time distribution.",
       why:"Traffic is the primary input to nearly every infrastructure decision: how many shards, how many replicas, what cache tier, what autoscaling policy. Get the order of magnitude wrong and your architecture is built for the wrong system. Get the peak-to-avg ratio wrong and you either over-provision (waste money) or melt during traffic spikes.",
       numbers:"Collect: avg RPS, p95 RPS, p99 RPS, peak-to-avg multiplier, DAU, MAU, data size today, data growth/month. Typical peak-to-avg: B2B SaaS 5–10× (workday peak), consumer 3–5× (evening peak), seasonal e-commerce 50–100× (Black Friday). Always size for peak with headroom, not average."
     },
     tradeoffs:[{axis:"Design for avg vs design for peak",left:"Cheaper infra",right:"No outage at peak",pos:0.7}],
     pitfalls:[
       {name:"Forgetting daily/weekly cycles",desc:"Average RPS is fine; the problem is the 9am Monday spike that's 8× higher. Always model the 24h/7d traffic curve, not just averages."},
       {name:"Ignoring data growth",desc:"100GB today, growing 10GB/month. In 3 years you'll have 460GB; in 5 years, 700GB. Postgres is fine; Cassandra is overkill. But at 100GB/month growth, in 5 years you have 6TB and need to plan for sharding now."}
     ],
     examples:[
       {name:"Reddit traffic spike from a viral post",desc:"A normal subreddit at 100 RPS gets a front-page post and goes to 10K RPS in 2 minutes. Reddit handles this with aggressive caching — most viral pages serve from a CDN within seconds. Demonstrates designing for known traffic patterns (virality) explicitly."}
     ],
     sizes_cfg:{
       small:{range:"<1K RPS avg, <5K peak, <1M DAU, <100GB data",rec:"Assume 5–10× daily peak over avg. A small SaaS hits peak at 9am–11am Mon–Fri.",tools:["Google Analytics","Mixpanel","back-of-napkin math"]},
       medium:{range:"1K–50K RPS avg, up to 250K peak, 1M–50M DAU, 100GB–10TB",rec:"Model 24h traffic curve. Identify timezone-driven peaks. Use 7-day moving avg for capacity planning.",tools:["Datadog APM","CloudWatch","load testing with k6"]},
       large:{range:"50K–500K RPS avg, up to 2M peak, 50M–500M DAU, 10TB–1PB",rec:"Traffic shaping becomes critical. Use token bucket at gateway. Model per-feature traffic separately.",tools:["Prometheus","Grafana","Locust","Vegeta"]},
       hyper:{range:">500K RPS avg, >5M peak, >500M DAU, >1PB",rec:"Traffic is modeled per PoP, per DC, per service. Capacity planning is a full team function with ML-based forecasting.",tools:["Custom forecasting","Envoy","Global load shedding"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">1K RPS sustained or >1M DAU",action:"Introduce horizontal scaling. Add a load balancer. Separate stateless compute from stateful data."},
       {from:"medium",to:"large",trigger:">50K RPS or >50M DAU",action:"Add regional traffic routing. Implement autoscaling. Consider CDN for static + cacheable content."},
       {from:"large",to:"hyper",trigger:">500K RPS or >500M DAU",action:"Deploy globally with anycast DNS. Per-datacenter capacity planning. Automated traffic shifting on failures."}
     ],
     children:[]},

    {name:"Read / Write Ratio",id:"req-rw",icon:"⚖️",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"Drives replica count and cache strategy",
     detail:{
       what:"The proportion of read operations to write operations in your workload. Determines whether to optimize for read scale (replicas, caches) or write scale (sharding, async, LSM stores).",
       why:"Same RPS leads to completely different architectures depending on R/W. A 100K RPS read-heavy system (99% reads) is solved by adding cache + replicas — relatively easy. A 100K RPS write-heavy system needs sharding, async pipelines, and write-optimized storage — much harder. Knowing the ratio early prevents building the wrong solution.",
       numbers:"Typical ratios: social feed 1000:1 read-heavy, e-commerce 10:1, analytics ingestion 1:100 write-heavy, chat 1:1. Within a single product different features have different ratios — analyze per feature, not just system-wide."
     },
     tradeoffs:[{axis:"Read optimization vs Write optimization",left:"More replicas, caches",right:"Async writes, sharding",pos:0.5},{axis:"Consistency vs Throughput",left:"Strong reads",right:"Stale reads OK",pos:0.5}],
     pitfalls:[
       {name:"Average ratio hides bursty writes",desc:"Average is 100:1 but every minute there's a 10-second burst at 1:10 (a batch import). Architecting for the average gets you crushed during bursts. Look at p99 ratio, not just average."},
       {name:"Writes that are actually reads",desc:"You count 'page view increment' as a write — but it's idempotent and you batch it. Distinguish durable writes (must persist) from telemetry writes (can drop). Architect them differently."}
     ],
     examples:[
       {name:"Twitter timelines (write-heavy fan-out)",desc:"When user with 1M followers tweets, that's 1M writes (insert into each follower's timeline). Twitter chose 'fan-out on write' so reads are O(1). The R/W decision shaped the entire feed architecture."}
     ],
     sizes_cfg:{
       small:{range:"Typically <10K reads/day, <1K writes/day",rec:"Don't optimize yet. Use a single Postgres instance. Add read replicas only when p99 read latency >200ms.",tools:["Postgres","SQLite"]},
       medium:{range:"Millions of reads/day, hundreds of thousands of writes",rec:"If >10:1 R/W: add 1–2 read replicas. If write-heavy: look at connection pooling (PgBouncer), async writes to queue.",tools:["PgBouncer","Redis","RabbitMQ"]},
       large:{range:"Billions of reads/day",rec:"Read-heavy: add Redis cache tier, CDN for computed results. Write-heavy: shard writes, use LSM-tree DB (Cassandra, RocksDB).",tools:["Redis Cluster","Cassandra","Kafka"]},
       hyper:{range:"Trillions of reads/day (CDN-served), petabytes written",rec:"Reads served by CDN edge (cache-hit rate >95%). Writes partitioned into streams, processed asynchronously.",tools:["Fastly","Cloudflare","Kafka","Flink"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Read latency p99 >200ms or DB CPU >70%",action:"Add read replica. Add Redis for hot keys. Analyze slow query log."},
       {from:"medium",to:"large",trigger:">10M reads/day or write queue growing",action:"Redis Cluster. Introduce CQRS (Command Query Responsibility Segregation): separate read model from write model."},
       {from:"large",to:"hyper",trigger:"Cache hit rate <90% or write throughput bottlenecked",action:"Global CDN. Write sharding. Event-sourced write pipeline."}
     ],
     children:[]},

    {name:"Latency SLOs",id:"req-latency",icon:"⚡",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"p50, p99, p999 targets per endpoint",
     detail:{
       what:"Service Level Objectives (SLOs) for response time, expressed as percentiles (p50 = median, p99 = 99th percentile, p999 = 99.9th percentile). Pinned per endpoint, since /search and /export have very different needs.",
       why:"Latency budget directly constrains architecture. A 10ms SLO (Service Level Objective) forces in-memory data and edge compute. A 200ms SLO allows DB (Database) round-trips. A 5s SLO allows complex computation. Without an explicit SLO, every engineer optimizes for their gut feel — some over-engineer, some under-deliver. Per-percentile matters because user experience is dominated by the tail: p99 is what your worst 1% of users see, and they're often your most active ones.",
       numbers:"Human perception: <100ms feels instant, 100–300ms feels fast, 300ms–1s feels noticeable lag, >1s feels broken. Common targets: interactive APIs p99 <200ms; background batch p99 <5s; real-time push p99 <100ms. Measure p99 not avg — averages hide the long tail entirely."
     },
     tradeoffs:[{axis:"Strict SLO vs Cost",left:"More infra needed",right:"Looser = cheaper",pos:0.6},{axis:"Consistency vs Latency",left:"Wait for quorum",right:"Serve stale data fast",pos:0.5}],
     pitfalls:[
       {name:"Optimizing average instead of p99",desc:"'Average is 50ms, we're great!' But p99 is 5s — 1 in 100 users has a terrible experience. Always measure and optimize tail percentiles. Average is misleading."},
       {name:"SLO ignores network",desc:"Server-side p99 is 50ms, but the user is in Australia and you're in Virginia — they see 250ms minimum. Either deploy regionally, or set SLO honestly to include network."},
       {name:"Same SLO across all endpoints",desc:"Wastes effort on low-traffic endpoints, under-delivers on hot paths. Tier endpoints: critical path (login, checkout) gets strictest SLO; long-tail (settings page) can be looser."}
     ],
     examples:[
       {name:"Amazon's 100ms = 1% revenue rule",desc:"Amazon found every 100ms of latency cost them 1% of sales. This is why Amazon over-invests in latency infrastructure (CDN, edge caching). For you: latency has direct revenue impact; quantify it."},
       {name:"Google's mobile 3-second rule",desc:"53% of mobile users abandon a page that takes >3s. Google built AMP and pushes Core Web Vitals because mobile latency is conversion-killing. The latency target depends on what users will tolerate, not what feels nice to engineers."}
     ],
     sizes_cfg:{
       small:{range:"p99 <500ms typically acceptable",rec:"Profile your DB queries first. Slow queries are 90% of latency problems at small scale. Add DB indexes before adding infra.",tools:["pg_stat_statements","EXPLAIN ANALYZE","NewRelic"]},
       medium:{range:"p99 <200ms target",rec:"Add Redis for frequent reads. Use connection pooling. Set query timeouts. Add APM to find latency contributors.",tools:["Redis","Datadog APM","PgBouncer"]},
       large:{range:"p99 <100ms for user-facing, <50ms for internal",rec:"CDN for cacheable responses. Read from replica. Use gRPC for internal services (lower overhead than REST).",tools:["CloudFront","Envoy","gRPC"]},
       hyper:{range:"p99 <50ms user-facing, <10ms internal, <1ms for hot paths",rec:"Serve from memory at edge. Precompute results. Use RDMA networking for intra-DC. Shard computation to minimize fan-out.",tools:["Edge workers","RDMA","eBPF","custom protocols"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"p99 >500ms despite DB indexing",action:"Add Redis cache. Move computed fields to denormalized read models."},
       {from:"medium",to:"large",trigger:"p99 >200ms at peak load",action:"CDN + edge caching. gRPC internal. Async non-critical paths."},
       {from:"large",to:"hyper",trigger:"p99 >100ms or p999 >1s",action:"Edge compute. Precomputed materialized views. Dedicated low-latency network paths."}
     ],
     children:[]},

    {name:"Availability SLO",id:"req-avail",icon:"🛡️",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"Nines of uptime vs cost of redundancy",
     detail:{
       what:"The percentage of time your service must be operational, measured over a window (typically a month or year). Translates to allowed downtime: 99.9% = 43min/month, 99.99% = 4.4min/month, 99.999% (5 nines) = 26s/month.",
       why:"Each extra nine is disproportionately more expensive: 99.9%→99.99% costs roughly 3–5× more (multi-AZ + automated failover), 99.99%→99.999% costs 4–10× on top of that (multi-region active-active + cell architecture + dedicated SRE team). The increases compound, not multiply by a flat 10×. Most products don't need 99.999% — but the ones that do (payments, healthcare, telecom) cannot tolerate less. Pick deliberately based on what your business and users actually need.",
       numbers:"99% = 7.3h/month down; 99.9% = 43min; 99.95% = 22min; 99.99% = 4.4min; 99.999% = 26s. Cost multipliers (rough): 99.9%=1×, 99.99%=3–5×, 99.999%=20–50×. Industry norms: consumer apps 99.9%, B2B SaaS 99.95%, financial systems 99.99%+, telecom/medical 99.999%."
     },
     tradeoffs:[{axis:"Availability vs Cost",left:"5 nines = $$$",right:"2 nines = $",pos:0.5},{axis:"Consistency vs Availability",left:"CP: refuse writes on partition",right:"AP: accept writes, resolve later",pos:0.5}],
     pitfalls:[
       {name:"Confusing component availability with system availability",desc:"5 services each at 99.9% in series = 99.5% total. Adding components reduces availability unless you build redundancy. Math the chain."},
       {name:"Counting only unplanned downtime",desc:"You exclude maintenance windows. Users don't care if the outage was 'planned' — they still can't use the product. Modern SLOs include all downtime; deploy without downtime."},
       {name:"No error budget consumption tracking",desc:"You set 99.99% but never measure it. By the time you find out, you've blown the budget for the year. Track error budget burn rate continuously; alert when projecting overage."}
     ],
     examples:[
       {name:"GitHub's 'mostly 99.95%'",desc:"Publishes monthly availability reports. Misses occasionally, communicates transparently, uses post-mortems to improve. Demonstrates that owning your SLO publicly is a feature, not a risk."},
       {name:"AWS S3's 11 nines of durability vs 99.9% availability",desc:"Important distinction: durability (data isn't lost) vs availability (you can access it now). S3 is extremely durable but 'only' 99.9% available. Different requirements; different mechanisms."}
     ],
     sizes_cfg:{
       small:{range:"99.9% acceptable (8.7h/year)",rec:"Single region, single AZ. Daily DB backups. Manual failover runbook. Use managed DB (RDS, Cloud SQL) for automated backups.",tools:["AWS RDS","Railway","PlanetScale free"]},
       medium:{range:"99.95% target (4.4h/year)",rec:"Multi-AZ deployment. Health checks + auto-restart. DB primary + standby in different AZ. Alert on error rate >1%.",tools:["AWS Multi-AZ RDS","Route53 health checks","PagerDuty"]},
       large:{range:"99.99% target (52min/year)",rec:"Multi-region active-passive. Automated failover with DNS TTL <60s. Circuit breakers on all service calls. Chaos engineering monthly.",tools:["AWS Route53","Consul","Netflix Hystrix","Chaos Monkey"]},
       hyper:{range:"99.999% target (5min/year)",rec:"Multi-region active-active. Per-cell architecture. Global load balancing with health-aware routing. Zero-downtime deploys mandatory.",tools:["Anycast DNS","Envoy","Spinnaker","custom failover"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Any outage costs >$10K or has customer SLA implications",action:"Add multi-AZ. Implement health checks. Automated restart on crash."},
       {from:"medium",to:"large",trigger:"Outage cost >$100K/hr or regulatory requirement",action:"Multi-region active-passive. Automated failover. Chaos engineering."},
       {from:"large",to:"hyper",trigger:"Any downtime is unacceptable (financial, safety, critical infra)",action:"Multi-region active-active. Per-cell isolation. N+2 redundancy everywhere."}
     ],
     children:[]},

    {name:"Consistency Model",id:"req-consist",icon:"🔗",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"Strong vs eventual — per operation type",
     detail:{
       what:"Consistency defines what value a read returns relative to recent writes. Strong consistency: read always sees the latest write. Eventual: read may see stale data for some window. Read-your-writes: you see your own writes immediately, but may see others' stale. Different operations in the same system can have different requirements.",
       why:"Strong consistency requires coordination — Paxos, Raft, two-phase commit — which means latency (10–100ms+ for cross-region quorum) and availability cost (CAP theorem (Consistency, Availability, Partition tolerance): pick C or A during partition). Eventual is cheap and fast, but the application must handle stale reads gracefully. Picking strong everywhere wastes performance; picking eventual everywhere creates user-visible bugs. Per-feature analysis is the only correct approach.",
       numbers:"Examples: bank balance = strong (you can't show stale money). Like count = eventual (5s staleness is fine). Shopping cart = read-your-writes (user sees their own additions immediately). Friend list = eventual with <60s staleness. Strong consistency latency floor: ~10ms within DC, ~30–80ms cross-region (quorum). Eventual: limited only by network."
     },
     tradeoffs:[{axis:"Strong vs Eventual consistency",left:"Correct, slower",right:"Fast, possibly stale",pos:0.5},{axis:"Availability vs Consistency (CAP)",left:"Always available",right:"Always correct",pos:0.5}],
     pitfalls:[
       {name:"Strong consistency by default everywhere",desc:"Easy to do; expensive to operate. Every read pays coordination cost even when staleness was fine. Audit per-feature: most features tolerate eventual; reserve strong for the few that don't."},
       {name:"Eventual consistency with no UX handling",desc:"User clicks 'Like', UI shows like, refresh — like disappeared (read hit a stale replica). User panics. Either: route reads after writes to primary (read-your-writes), or have UI optimistically reflect the local action."},
       {name:"Distributed transactions across services",desc:"Two-phase commit across microservices is fragile and slow. Use saga pattern (compensating transactions) or accept eventual consistency with reconciliation."}
     ],
     examples:[
       {name:"Amazon shopping cart (eventual)",desc:"Famously, Amazon's cart is eventually consistent — adding items can show stale state for a few seconds. They prefer 'always allow add to cart' (availability) over 'show exact state' (consistency). Reasonable: a stale cart is a small annoyance; a 503 means lost revenue."},
       {name:"Google Spanner's TrueTime",desc:"Achieves global strong consistency by using GPS + atomic clocks for synchronized timestamps. Costs ~10ms commit latency for the privilege. Demonstrates that strong+global is possible but expensive — the price tag tells you whether you really need it."}
     ],
     sizes_cfg:{
       small:{range:"Strong consistency everywhere is fine at this scale",rec:"Use Postgres transactions. Serializable isolation for financial data. Default to strong — you won't pay meaningful latency penalty.",tools:["Postgres SERIALIZABLE","SQLite WAL"]},
       medium:{range:"Mix: strong for writes, eventual for reads",rec:"Write to primary, read from replica (eventual). Use Redis cache with TTL. For critical reads (payment, auth) always read from primary.",tools:["Postgres read replicas","Redis TTL","read-your-writes via session stickiness"]},
       large:{range:"Per-feature consistency budget",rec:"Map each feature: payment/inventory=strong, feed/likes=eventual. Use CRDT for counters. Saga pattern for distributed transactions.",tools:["Saga pattern","CRDT","TiDB","CockroachDB for strong at scale"]},
       hyper:{range:"Geo-distributed: latency vs consistency explicit tradeoff",rec:"Spanner for global strong (uses TrueTime). Dynamo-style for high-availability eventual. Per-region strong, cross-region eventual with conflict resolution.",tools:["Google Spanner","DynamoDB","Cassandra tunable","Vitess"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Read replica added → staleness risk",action:"Identify which reads require read-your-writes. Route those to primary. Cache with short TTL."},
       {from:"medium",to:"large",trigger:"Distributed transactions needed across services",action:"Implement Saga pattern. Use outbox pattern for reliable events. Identify CRDT candidates."},
       {from:"large",to:"hyper",trigger:"Multi-region writes required",action:"Choose per-region: Spanner (strong, $$$) or Dynamo-style (eventual, cheap). Implement conflict resolution for eventual."}
     ],
     children:[]},

    {name:"Geography",id:"req-geo",icon:"🌍",phase:"Requirements",color:"#6b7280",
     sizes:["small","medium","large","hyper"],
     short:"Single region → global active-active",
     detail:{
       what:"Where your users are, where your compute is, where your data is. Determines deployment topology (single region, multi-region, edge), routing strategy (GeoDNS, anycast), and compliance constraints (GDPR data residency, China data localization).",
       why:"Speed of light is a hard constraint: London↔NYC is ~70ms minimum, no software optimization can fix it. If you have a 100ms SLO and users on multiple continents, you must deploy regionally. Geography also drives compliance: EU data must stay in the EU, China data in China, etc. Underestimate geographic distribution and your global users have a slow, possibly illegal experience.",
       numbers:"Speed of light limits: within 1 region <1ms RTT, cross-AZ <5ms, cross-region same continent 30–80ms, cross-continent 80–300ms. CDN serves static globally at 5–30ms. Compliance: GDPR (EU), CCPA (California), LGPD (Brazil), PIPL (China) — each may require data residency."
     },
     tradeoffs:[{axis:"Global coverage vs Operational complexity",left:"More regions = more ops",right:"Single region = simple",pos:0.5},{axis:"Data locality vs Data consistency",left:"Local = fast",right:"Global = consistent",pos:0.5}],
     pitfalls:[
       {name:"Adding regions for marketing reasons",desc:"'We're global!' but users don't actually care. You doubled your ops burden for no real benefit. Add regions only when latency or compliance demands it."},
       {name:"Multi-region without thinking through data",desc:"Deploy compute to 3 regions but DB still in one. Now those regions hit cross-region DB latency on every request — slower than before. Multi-region requires distributed data, which requires consistency thinking."},
       {name:"Ignoring data residency until audit",desc:"You've been storing EU user data in us-east-1 for 2 years. GDPR audit reveals it. Fines + remediation effort = 6 months of work. Address residency from day 1 if you have any EU users."}
     ],
     examples:[
       {name:"Netflix's regional architecture",desc:"Each AWS region runs a full copy of Netflix. Users routed to nearest region. If a region goes down, traffic shifts to another. Trade-off: data is asynchronously replicated across regions, so brief inconsistencies happen. Acceptable for video streaming."},
       {name:"Stripe's data residency offering",desc:"Stripe lets enterprise customers pin payment data to specific regions for compliance. Demonstrates data residency as a product feature — increasingly required for selling to enterprise."}
     ],
     sizes_cfg:{
       small:{range:"Single region, users mostly in one geography",rec:"Pick the AWS/GCP/Azure region closest to your users. Don't over-engineer. A CDN for static assets is sufficient global presence.",tools:["AWS us-east-1 or eu-west-1","Cloudflare CDN","Vercel for static"]},
       medium:{range:"Users in 2–3 continents",rec:"CDN globally for static + cacheable content. Compute in 1–2 regions. Use edge workers for personalization (Cloudflare Workers, Lambda@Edge).",tools:["Cloudflare","AWS CloudFront","Lambda@Edge"]},
       large:{range:"Users globally, latency-sensitive",rec:"Deploy compute in 3+ regions. Active-passive with automated failover. Data replication cross-region async. CDN everywhere. Data residency (GDPR, CCPA) compliance.",tools:["AWS multi-region","Global Accelerator","Terraform modules"]},
       hyper:{range:"Global, every continent, latency SLO <50ms everywhere",rec:"Active-active multi-region. Per-PoP edge compute. Anycast routing. Data partitioned by geography with cross-region replication for non-PII. Dedicated compliance per jurisdiction.",tools:["Anycast","Fastly","Akamai","custom BGP"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">20% traffic from outside home region",action:"Add CDN globally. Add second region for HA. Edge workers for dynamic personalization."},
       {from:"medium",to:"large",trigger:">40% traffic from second geography or GDPR applies",action:"Multi-region compute. Data residency controls. Regional data partitioning."},
       {from:"large",to:"hyper",trigger:"Latency SLO <50ms globally or >1B global users",action:"Active-active multi-region. Anycast. Per-jurisdiction data isolation. PoP network."}
     ],
     children:[]}
  ]
};
