const PHASE_SHARDING = {
  name:"Phase 5 · Sharding & Replication",id:"shard",icon:"🔀",phase:"Sharding",color:"#d97706",
  sizes:["small","medium","large","hyper"],
  short:"Key design · shard count · replication model · routing",
  detail:{
    what:"Two related but distinct concepts. Sharding (horizontal partitioning): splitting your data across multiple databases so each holds a subset — necessary when one machine can't hold or serve all data. Replication: copying each shard's data to additional nodes for availability and read scaling. Together they're the core of every distributed database, and the source of most of its complexity.",
    why:"You shard because vertical scaling has run out — the biggest available machine can't hold or serve your data. You replicate because every machine eventually fails and you can't accept downtime when it does. Both come with serious costs: sharding eliminates joins across shards, complicates transactions, and requires careful key design. Replication introduces consistency questions (which copy is authoritative?) and operational overhead (failover, lag monitoring). Get either wrong and you'll have hot spots, data loss, or both.",
    numbers:"Rule of thumb: don't shard until you've exhausted vertical scaling and read replicas — vertical is typically 3–5× cheaper than horizontal in ops effort. Shard count: powers of 2 (16, 32, 64, 256) make rebalancing easier. Replication factor: typically 3 (one primary, two replicas) — survives 1–2 node failures. RPO (Recovery Point Objective) (data-loss tolerance): synchronous replication = 0; asynchronous = seconds-to-minutes worth of writes."
  },
  tradeoffs:[
    {axis:"Topology",left:"Single node: simple ops, ceiling at one machine's CPU/RAM/IOPS",right:"Sharded across N nodes: scales linearly with shards, routing and rebalancing complexity"},
    {axis:"Consistency model",left:"Leader-based (Raft consensus): one writer per shard, strong consistency, brief unavailability during leader election",right:"Leaderless (Dynamo-style quorum): any replica accepts writes, always available, conflicts resolved at read time"}
  ],
  pitfalls:[
    {name:"Sharding too early",desc:"You shard at 5K RPS because 'we'll grow.' Now every query needs cross-shard coordination, and most days you're at 1K RPS. Vertical-scale-first is almost always right; resharding later is hard but feasible."},
    {name:"Cross-shard transactions",desc:"Your shard key is user_id. A 'transfer money between users' transaction touches two shards. Distributed transactions (2PC (Two-Phase Commit)) are slow and fragile. Either: choose a shard key that keeps transactions local (e.g., account_id), or use saga pattern with compensating actions."},
    {name:"Async replication + read-your-writes failure",desc:"User updates profile → reads it back from replica → sees old data → confused. Either route post-write reads to primary, or accept staleness with a UI hint."},
    {name:"Resharding without a plan",desc:"Hot shard discovered. You decide to split. With no shard map versioning, no online-resharding tooling, this becomes a months-long downtime. Build resharding capability before you need it (Vitess, Citus already have it)."},
    {name:"Routing layer is single point of failure",desc:"All requests go through one proxy. Proxy crashes = full outage. Routing layer must itself be redundant (multiple proxies, gossip, smart client)."}
  ],
  examples:[
    {name:"Vitess at YouTube/Slack",desc:"YouTube built Vitess to shard MySQL when single-node MySQL couldn't keep up. Now Slack and many others use it. Demonstrates that mature sharding tooling exists; you don't always have to roll your own."},
    {name:"Discord's bucketed time-series sharding",desc:"Each shard holds messages bucketed by (channel_id, time_bucket). Predictable distribution, time-ordered queries within bucket. Demonstrates that the right composite key shape unlocks both even distribution AND query locality."},
    {name:"Instagram's user-id sharding",desc:"Sharded by user_id from very early. Each user's data lives on one shard; all of their reads are local. Worked well for years; eventually had to add cross-shard for features like search."}
  ],
  levelUp:[],
  children:[
    {name:"Shard Key Design",id:"shard-key",icon:"🗝️",phase:"Sharding",color:"#d97706",
     sizes:["large","hyper"],short:"Composite key: time bucket + entity + sub-bucket",
     detail:{
       what:"The function (hash, range, composite) that maps a record to a specific shard. The shard key determines which shard owns each row. Once data is in production, changing the shard key requires re-sharding — a months-long project.",
       why:"This is the single most important decision in horizontal sharding. A bad shard key creates hot spots: 80% of writes hit one shard, the other shards idle, you've gained nothing from sharding. A good key spreads writes evenly while keeping related data on the same shard so common queries don't need to fan out. The tension between 'spread evenly' and 'keep together' is the core puzzle.",
       numbers:"Good key health: each shard within ±20% of average traffic. Bad key: one shard at 5–10× average = hot spot. Cardinality: shard key should have at least 10× more distinct values than shard count (so distribution is fine-grained). Cross-shard query rate: keep <10% of queries — beyond that, consider co-location or composite keys."
     },
     tradeoffs:[
       {axis:"Shard key strategy",left:"Group related rows on the same shard (e.g., by user_id): cheap multi-row queries, hot shards on celebrity users",right:"Spread rows uniformly: even write load, every multi-row query fans out across all shards"},
       {axis:"Range vs hash key",left:"Range-partitioned (e.g., by timestamp): efficient range scans, time-bucket hotspots on recent writes",right:"Hash-partitioned: uniform write distribution, range scans require scatter-gather across all shards"}
     ],
     pitfalls:[
       {name:"Monotonically increasing key (auto-increment, timestamp)",desc:"All new writes go to the same shard (the 'tail'). Other shards idle. Use hash of key, or composite with a high-cardinality entity ID."},
       {name:"Sharding by tenant when one tenant is huge",desc:"99 small tenants on 99 shards, 1 huge tenant on 1 shard handling 80% of traffic. The big tenant must itself be sub-sharded (composite key: tenant + sub-bucket)."},
       {name:"Sharding by enum-like field",desc:"Sharded by 'status' (10 distinct values). 10 shards possible; if status='active' is 90% of rows, that shard is overloaded. Cardinality must be high."},
       {name:"Sharding by user-controllable field",desc:"User-supplied data as shard key — attacker can pick a key that maps to one shard and overload it. Hash user input before using as shard key."}
     ],
     examples:[
       {name:"Twitter's user_id sharding",desc:"Tweets sharded by user_id (hash). Reading a user's tweets = single-shard query. Cross-user queries (timeline assembly) require fan-out. The trade-off was acceptable because timeline reads were already cached."},
       {name:"DynamoDB hot partition errors",desc:"Famous failure mode: a single partition key getting too much traffic returns ProvisionedThroughputExceededException even when overall capacity is fine. AWS docs explicitly warn against this. Demonstrates: hot keys are not theoretical."}
     ],
     sizes_cfg:{
       large:{range:"Horizontal sharding required",rec:"Composite key: utc_hour_bucket + entity_id (e.g. datacenter_id or tenant_id). This gives temporal affinity for range queries AND cardinality for write spread. Avoid: local time (rotating hot spots), monotonically increasing IDs (sequential writes to one shard).",tools:["Consistent hashing","Citus shard keys","Cassandra partition keys","Vitess vschema"]},
       hyper:{range:"Global multi-datacenter sharding",rec:"utc_hour_bucket + datacenter_id + sub_bucket. Sub-bucket = hash(user_id) % K where K proportional to DC traffic share. For hot DCs: K=6 for 60% traffic share. Weighted consistent hashing for adaptive rebalancing.",tools:["Jump consistent hash","Google Maglev","DynamoDB partition key design","Cassandra token ring"]}
     },
     levelUp:[
       {from:"large",to:"hyper",trigger:"Single datacenter carries >50% of writes (hot DC)",action:"Add sub-bucket component: hash(user_id) % K. K proportional to traffic share. Bounded fan-out on queries to K shards."}
     ],
     children:[]},

    {name:"Replication Model",id:"shard-repl",icon:"📡",phase:"Sharding",color:"#d97706",
     sizes:["small","medium","large","hyper"],short:"Single → replicas → Raft (consensus algorithm) leader → leaderless quorum",
     detail:{
       what:"How data is copied across nodes for durability and availability. Single node + backups: simplest, slow recovery. Async replication: primary writes to replicas in background; primary fails over manually or auto. Raft (consensus algorithm)/Paxos (consensus algorithm): consensus protocol elects a leader for each shard; failover is automatic in seconds. Leaderless quorum (Dynamo-style): any node accepts writes; consistency tuned via R+W>N quorum rules.",
       why:"Every disk fails eventually. Every machine eventually crashes. Replication determines whether that's a brief blip or an outage. Each model trades off three things: write latency (sync replication slows writes), failover speed (Raft (consensus algorithm) is seconds; manual is minutes), and consistency model (leader-based = strong, leaderless = eventual). Match to what your business actually needs.",
       numbers:"RPO (Recovery Point Objective) targets: backups-only RPO (Recovery Point Objective)~hours; async replication RPO (Recovery Point Objective)~seconds; sync replication RPO (Recovery Point Objective)=0. RTO (Recovery Time Objective) targets: manual failover ~30 min; automated multi-AZ ~30–60s; Raft (consensus algorithm) auto-election ~5–10s. Replication factor 3 is the standard sweet spot — survives 1–2 node failures, doesn't waste 4+ copies of every write."
     },
     tradeoffs:[
       {axis:"Replication mode",left:"Synchronous replication: writes ack only after replicas confirm; zero data loss on failover, +5–30ms write latency",right:"Asynchronous replication: low write latency; last few seconds of writes can be lost if the primary dies"},
       {axis:"Coordination model",left:"Leader-based (Raft): one elected writer, consistent, brief unavailability during leader election",right:"Quorum-based (Dynamo): any node writes if quorum agrees, always available, replicas may briefly diverge"}
     ],
     pitfalls:[
       {name:"Replication lag in monitoring blind spot",desc:"Replica is 30 minutes behind primary; reads are 30 min stale; you find out from a customer support ticket. Always monitor replication lag explicitly; alert when it exceeds expected."},
       {name:"Failover during a network blip",desc:"Brief network glitch triggers automatic failover; old primary recovers, now you have two primaries (split-brain) writing conflicting data. Use proper consensus (Raft (consensus algorithm)) or fencing tokens to prevent."},
       {name:"Read-your-writes broken on replicas",desc:"Write to primary, read from replica → stale. Either route reads after writes to primary (session-stickiness), or use 'read-after-write' guarantee (replicas wait for write to propagate)."},
       {name:"Quorum settings nobody understands",desc:"Cassandra W=ONE, R=ONE → fastest, completely inconsistent. W=ALL, R=ALL → unavailable on single failure. The classic safe default: W=QUORUM, R=QUORUM with N=3. Document your choice and why."}
     ],
     examples:[
       {name:"GitHub's MySQL → Orchestrator failover",desc:"Uses Orchestrator + Raft (consensus algorithm) for automatic MySQL failover in seconds. Documented post-mortems show how complex failover-under-load is, even with mature tooling. Demonstrates: automatic failover is a production capability, not a checkbox."},
       {name:"Cassandra's tunable consistency at Netflix",desc:"Different keyspaces use different W/R quorums based on importance: payment-related uses higher consistency, view-tracking uses lower. Demonstrates per-workload tuning of replication."}
     ],
     sizes_cfg:{
       small:{range:"Single node with backups",rec:"Managed DB with automated daily backups. Point-in-time recovery. Single node is fine if you can tolerate 15–30 min RTO (Recovery Time Objective). Use managed service (RDS) for easy snapshots.",tools:["RDS automated backups","pg_dump cron","Cloud SQL"]},
       medium:{range:"Primary + 1–2 read replicas",rec:"Async replication for read replicas. Promotes to primary on failure (manual or semi-automated). Replication lag monitoring. Multi-AZ for automatic failover.",tools:["RDS Multi-AZ","Cloud SQL HA","Patroni (self-managed)","pg_replication_slots"]},
       large:{range:"Raft (consensus algorithm)-based leader election per shard",rec:"Each shard runs Raft (consensus algorithm) (3 or 5 nodes). Automatic leader election on failure (seconds, not minutes). Leader handles all writes. Reads can be from leader or replica depending on consistency requirement.",tools:["etcd","CockroachDB (Raft (consensus algorithm))","TiKV","Patroni + ZooKeeper"]},
       hyper:{range:"Leaderless quorum OR multi-region Raft (consensus algorithm)",rec:"Leaderless (Dynamo-style): W+R>N. W=2,R=2,N=3 for balanced. Any node accepts writes. Read repair + anti-entropy for convergence. Conflict resolution: LWW for simple, CRDT (Conflict-free Replicated Data Type) for counters, vector clocks for complex.",tools:["Cassandra (quorum)","DynamoDB","Riak","custom CRDT (Conflict-free Replicated Data Type) libraries"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"RTO (Recovery Time Objective) >1h unacceptable or read load requires offloading",action:"Add read replica. Multi-AZ for automated failover. Monitor replication lag."},
       {from:"medium",to:"large",trigger:"Manual failover too slow or multi-shard needed",action:"Raft (consensus algorithm) per shard. Automatic leader election in seconds. ZooKeeper/etcd for coordination."},
       {from:"large",to:"hyper",trigger:"Multi-region writes required or partition tolerance critical",action:"Leaderless quorum. CRDT (Conflict-free Replicated Data Type) for counters. Conflict resolution policy per data type."}
     ],
     children:[]},

    {name:"Routing Layer",id:"shard-route",icon:"🗺️",phase:"Sharding",color:"#d97706",
     sizes:["medium","large","hyper"],short:"How requests find the right shard — no SPOF",
     detail:{
       what:"The mechanism that takes a query and figures out which shard owns the relevant data, then sends the query there. Three common patterns: stateless proxy (client → proxy → shard, mongos-style); gossip (every DB node knows the topology, any node can route); smart client (client library knows topology, talks directly to owner shard).",
       why:"Without a routing layer, every client has to know the entire shard map and update it whenever you reshard — operational nightmare. With centralized routing, you've added a hop (latency + failure point). The right pattern depends on shard count and latency budget. The routing layer must itself be highly available — if it goes down, you've replaced one SPOF with another.",
       numbers:"Latency overhead: stateless proxy adds 1–2ms per hop. Smart client: 0 hops, 0ms overhead but client complexity. Topology change propagation: gossip ~1s, ZooKeeper ~100ms, smart client refresh on MOVED redirect ~immediate. Routing throughput: proxies handle 100K–1M RPS; gossip and smart clients are limited only by individual nodes."
     },
     tradeoffs:[
       {axis:"Routing topology",left:"Centralized proxy (Vitess, ProxySQL): one place to manage routing rules; the proxy is a single point of failure",right:"Gossip-based (Cassandra ring): every node knows the topology, no proxy hop, more chatter on the wire"},
       {axis:"Routing freshness",left:"Look up the shard map on every request: always current, +1ms lookup",right:"Cache the shard map in clients: zero lookup latency, occasional misroutes for a few seconds after a rebalance"}
     ],
     pitfalls:[
       {name:"Proxy as bottleneck",desc:"All traffic flows through proxy tier; proxy CPU saturates first. Always: scale proxies horizontally (multiple instances behind LB), or move to smart-client/gossip."},
       {name:"Stale shard map after resharding",desc:"You moved data from shard 5 to shard 12; clients/proxies still route to shard 5. Either: route by query first to old shard which forwards to new (during migration), or atomic cutover with synchronized map update."},
       {name:"Routing logic in application code",desc:"Each service computes its own shard mapping. Now resharding requires updating every service. Centralize routing logic in a library or proxy."}
     ],
     examples:[
       {name:"MongoDB mongos",desc:"Stateless proxy tier. Clients talk to mongos, which knows the shard map (cached from config servers). Adds a hop but vastly simplifies clients. Pattern works well up to large shard counts."},
       {name:"Redis Cluster's smart client",desc:"Client library holds shard map locally. Direct connection to owner shard — zero overhead. On topology change, server returns MOVED redirect; client updates and retries. Demonstrates the smart-client approach to zero-hop routing."}
     ],
     sizes_cfg:{
       medium:{range:"2–10 shards",rec:"Stateless proxy router (mongos-style). Multiple router instances behind load balancer. Shard map in ZooKeeper/etcd. Routers cache map locally — stale routes trigger retries, not errors.",tools:["mongos (MongoDB)","Vitess vtgate","ProxySQL","custom stateless router"]},
       large:{range:"10–500 shards",rec:"Gossip protocol for topology. Every DB node knows full shard map. Coordinator pattern: any node can route for this request. No external dependency for routing.",tools:["Cassandra gossip","consistent hashing ring","etcd for shard map"]},
       hyper:{range:">500 shards, global",rec:"Smart client holds shard map locally. Direct connection to owner node. Client refreshes map on MOVED response. Background map refresh every 30s. Zero extra hops.",tools:["Redis Cluster smart client","Kafka client metadata","custom shard map client"]}
     },
     levelUp:[
       {from:"medium",to:"large",trigger:">50 shards or routing becoming bottleneck",action:"Move from proxy to gossip or smart client. Eliminate routing as single point."},
       {from:"large",to:"hyper",trigger:"Any routing latency unacceptable",action:"Smart client with local map. Zero-hop routing. MOVED redirect as error recovery."}
     ],
     children:[]}
  ]
};
