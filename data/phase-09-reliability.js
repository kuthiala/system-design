const PHASE_RELIABILITY = {
  name:"Phase 9 · Reliability & DR",id:"reliability",icon:"🛟",phase:"Reliability",color:"#dc2626",
  sizes:["small","medium","large","hyper"],
  short:"Backups → multi-AZ → multi-region → active-active",
  detail:{
    what:"Reliability engineering is the discipline of designing systems that survive failure: hardware (disks, NICs, whole machines), software (bugs, memory leaks), network (partitions, latency spikes), human (bad deploys, rm -rf), and environmental (region outages, fiber cuts). Disaster Recovery (DR) is the worst-case subset: how to restore service after a catastrophic event. Together they're the practices, redundancy, and automation that turn a fragile system into a robust one.",
    why:"Failure is inevitable; outages are a choice. Every disk fails eventually. Every server crashes eventually. Every region has had multi-hour outages (us-east-1 most famously). The only question is whether your system has been designed to survive these events without your customers noticing — or whether you'll spend hours doing manual recovery while revenue bleeds. Each level of reliability roughly doubles cost: single-AZ → multi-AZ ($$), multi-region passive ($$$), multi-region active ($$$$). Buy what your business case justifies.",
    numbers:"MTTR (Mean Time To Recovery) (Mean Time To Recovery) targets by tier: small <4h, medium <30min, large <5min, hyper <30s. RPO (data loss) targets: backups-only=hours, async replication=seconds-minutes, sync replication=0. Industry benchmarks: AWS region-level outage probability is roughly 1 per region per 1–3 years. Multi-AZ failover: ~30–60s automated. Multi-region failover: 5–15 min if practiced, much longer if not."
  },
  tradeoffs:[{axis:"Cost vs Resilience",left:"Single region: cheap",right:"Multi-region: expensive",pos:0.5},{axis:"RTO vs Complexity",left:"Fast recovery: complex failover",right:"Simple: slow recovery",pos:0.5}],
  pitfalls:[
    {name:"Untested DR plan",desc:"Runbook says 'failover to us-west-2' — but it's never been tried. The day of the actual outage, you discover the IAM roles aren't configured, the DB snapshot is 12 hours stale, and DNS TTLs are 1 hour. Practice DR quarterly with real failovers."},
    {name:"Single region 'because it's HA'",desc:"Multi-AZ is not multi-region. AWS us-east-1 has had multi-hour control-plane outages where Multi-AZ couldn't help. If your business needs >99.95%, you need multi-region — full stop."},
    {name:"Cascading failures (no circuit breakers)",desc:"Service A times out calling B → A's threads pile up → A fails → callers of A pile up → full system down. One slow downstream shouldn't kill the upstream. Add circuit breakers and timeouts on every external call."},
    {name:"No load shedding under overload",desc:"Traffic spike → all requests slow → all requests time out → CPU goes to 100% serving timeouts → everything fails. Better: shed 50% of requests with 503, keep the other 50% fast. Better an honest failure than a slow success."}
  ],
  examples:[
    {name:"Netflix Chaos Monkey (origin)",desc:"Built in 2010 to randomly kill EC2 instances during business hours. Forced engineers to design for failure as the default case. Result: Netflix routinely survives AWS outages that take down half the internet. Failure-as-test is non-negotiable."},
    {name:"Cloudflare's 2019 outage from a regex",desc:"A single bad regex deployed globally took down all of Cloudflare for 27 minutes. Lesson: blast radius matters. Cloudflare now uses staged deployments and per-region rollouts. A bug that ships to one region shouldn't take down all of them."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Outage cost >$10K or user SLA commitment",action:"Multi-AZ. Automated health checks. On-call rotation."},
    {from:"medium",to:"large",trigger:"Outage cost >$100K/hr or regulatory requirement",action:"Multi-region active-passive. Circuit breakers. Chaos engineering."},
    {from:"large",to:"hyper",trigger:"Zero downtime requirement or financial/safety system",action:"Multi-region active-active. Cell architecture. N+2 redundancy."}
  ],
  sizes_cfg:{
    small:{range:"99.9% SLO (Service Level Objective), single region",rec:"Daily DB backups to separate region. Basic health check + auto-restart. Error alerting (PagerDuty or OpsGenie). Manual runbook for incidents. Single on-call engineer.",tools:["AWS RDS automated backup","UptimeRobot","PagerDuty basic","Sentry"]},
    medium:{range:"99.95% SLO (Service Level Objective), multi-AZ",rec:"Multi-AZ DB failover (automatic, <60s). Health check every 30s. Error rate SLO (Service Level Objective) alert. Incident response runbook. Load balancer auto-removes unhealthy nodes.",tools:["AWS RDS Multi-AZ","Route53 health checks","PagerDuty","Runbook automation"]},
    large:{range:"99.99% SLO (Service Level Objective), multi-region passive",rec:"Multi-region active-passive. Automated failover with DNS switch. Circuit breakers on all service calls (Hystrix/Resilience4j). Chaos engineering monthly. SRE team. Game days for DR testing.",tools:["Circuit breakers","Chaos Monkey","AWS Route53 failover","Consul","SRE practices"]},
    hyper:{range:"99.999% SLO (Service Level Objective), multi-region active-active",rec:"Active-active: all regions serve traffic. Cell-based deployment isolates failures to N% of users. Zero-downtime deploys (canary + rollback). Automated runbooks for all known failure modes. Continuous chaos engineering.",tools:["Cell architecture","Canary deployments","custom health check platform","automated remediation bots"]}
  },
  children:[
    {name:"Circuit Breakers",id:"rel-cb",icon:"⚡",phase:"Reliability",color:"#dc2626",
     sizes:["medium","large","hyper"],short:"Fail fast instead of cascading",
     detail:{
       what:"A circuit breaker is a wrapper around an external call (HTTP, DB, RPC) that tracks failure rate. When too many calls fail or time out, the breaker 'opens' — subsequent calls fail immediately without even trying. After a cooldown, the breaker tentatively half-opens, allowing one probe call to test recovery. Closes (resumes normal traffic) when probes succeed.",
       why:"Without circuit breakers, a slow downstream causes thread/connection pool exhaustion in your service: each waiting call holds a thread, threads run out, your service starts rejecting healthy traffic. The slow downstream cascaded into your outage. With breakers, you fail fast: take 1ms to return an error, free the thread, serve other requests, return a graceful fallback to users. Your service stays healthy while the dependency is sick.",
       numbers:"Typical thresholds: open after 50% failure rate over a 10-second sliding window with min 20 requests. Half-open probe rate: 1 request per 5 seconds. Close after 5 consecutive successes. Timeout setting: 95th percentile of healthy latency × 1.5. Effect: a downstream that goes 100% bad costs you ~10s of degradation (until breaker opens) instead of unbounded cascading failure."
     },
     tradeoffs:[{axis:"Availability vs Correctness",left:"Fallback data: available",right:"Real data: correct",pos:0.5}],
     pitfalls:[
       {name:"No fallback when breaker opens",desc:"Breaker opens → calls fail with 'circuit open' error → your service surfaces this to users. Now they get explicit errors instead of slowness. Define a fallback: cached data, default value, or graceful degradation (e.g., 'recommendations unavailable, showing trending'). Breakers without fallbacks are half-built."},
       {name:"Breaker per-instance instead of per-dependency",desc:"Each replica of your service has its own breaker; one replica trips while others don't. The downstream service sees a 50% drop, not a clean off. Use distributed breakers (service mesh, shared state) for clean cutover."},
       {name:"Timeout longer than user request",desc:"Your API has 1s SLO (Service Level Objective); your DB call has 5s timeout. The user already gave up but you're still holding the connection. Set timeouts based on the caller's budget, not the callee's max."}
     ],
     examples:[
       {name:"Netflix Hystrix",desc:"Pioneered circuit breaker pattern at scale. Each service had hundreds of breakers, dashboards showed health of each dependency in real-time. Now superseded by Resilience4j and service mesh circuit breaking, but established the pattern."},
       {name:"Amazon's 2018 'one-AZ outage stays one AZ'",desc:"After early outages where one AZ failure cascaded, AWS made circuit-breaking and bulkheading default in their internal services. A bad AZ now stays bad — doesn't propagate."}
     ],
     sizes_cfg:{
       medium:{range:"2+ service dependencies",rec:"Add circuit breaker on all external calls. Define fallback for each: cached data, default value, or graceful degradation.",tools:["Resilience4j","Polly (.NET)","Hystrix (deprecated)","Envoy upstream health"]},
       large:{range:"10+ services",rec:"Service mesh enforces circuit breaking at network level. Per-service SLO (Service Level Objective) budgets. Fallback catalog maintained by each team.",tools:["Istio","Linkerd","Envoy","AWS App Mesh"]},
       hyper:{range:"500+ services",rec:"Automated circuit breaking by service mesh. ML-based anomaly detection. Automatic fallback routing to healthy replicas.",tools:["Envoy with Outlier Detection","custom ML alerting","automated traffic shifting"]}
     },
     levelUp:[],
     children:[]}
  ]
};
