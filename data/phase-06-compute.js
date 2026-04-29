const PHASE_COMPUTE = {
  name:"Phase 6 · Compute & Scaling",id:"compute",icon:"🖥️",phase:"Compute",color:"#059669",
  sizes:["small","medium","large","hyper"],
  short:"Single server → auto-scaling → multi-region active-active",
  detail:{
    what:"The compute layer is the fleet of servers (or containers, or functions) running your application code, plus the load balancers in front of them and the auto-scaling rules behind them. Decisions: what abstraction (VMs (Virtual Machines) vs containers vs serverless), how many instances at any moment, how to route traffic, how to keep them healthy.",
    why:"Compute is usually the largest line item on your cloud bill (40–70%). Over-provisioning by 2× doubles that cost; under-provisioning means outages exactly when traffic peaks. Auto-scaling done right means you pay for what you use; done wrong, it scales up too slowly to save the day or down too aggressively into outages. The compute model also gates deploy velocity — VMs (Virtual Machines) in 5–10 min, containers in 30s, functions in <1s.",
    numbers:"Healthy autoscaling target: 60–70% CPU steady-state. <40% sustained = overprovisioned; >80% = no headroom for spikes. Scale-up reaction: aim for instances ready in <2 minutes (containers do this; VMs (Virtual Machines) can't). Scale-down: hold 10–15 min after load drops to avoid flapping. Rule: provision for p99 traffic, not average."
  },
  tradeoffs:[
    {axis:"Provisioning headroom",left:"Tight (target 70% CPU): minimum spend, melts when traffic doubles unexpectedly",right:"Generous (target 30% CPU): handles 3–5× spikes gracefully, pays for mostly-idle servers"},
    {axis:"State location",left:"Stateless services: scale by adding instances; any LB strategy works; restarts are free",right:"Stateful services (in-memory sessions, local disk): sticky sessions or shared store needed; horizontal scaling is hard"}
  ],
  pitfalls:[
    {name:"Stateful processes with horizontal scaling",desc:"You scale to 10 instances, each holding in-memory session state. User's session works on one instance, fails on the others. Externalize state (Redis/DB) before scaling out."},
    {name:"Autoscaling on the wrong metric",desc:"Scale on CPU, but bottleneck is DB connections. CPU stays at 30%, requests queue, latency spikes — autoscaler does nothing. Pick the metric that actually correlates with user pain (RPS, queue depth, p99 latency)."},
    {name:"Slow autoscaling vs fast traffic spikes",desc:"Scale-up takes 3 minutes; viral spike happens in 30 seconds. By the time new instances are ready, the spike is over and your old fleet has crashed. Pre-warm capacity before known events; use load shedding for the rest."}
  ],
  examples:[
    {name:"Netflix autoscaling at predictable peaks",desc:"Knows from history that traffic surges at 7pm in each timezone. Pre-scales 30 minutes before — doesn't rely on reactive autoscaling for known patterns. Reactive scaling handles only the noise."},
    {name:"Reddit's 'hug of death' shedding",desc:"When a post goes viral and traffic 50×s in seconds, Reddit serves degraded (cached) versions of pages rather than trying to autoscale. Better to serve old content than to fall over."}
  ],
  levelUp:[],
  children:[
    {name:"Compute Model",id:"compute-model",icon:"⚙️",phase:"Compute",color:"#059669",
     sizes:["small","medium","large","hyper"],short:"VMs (Virtual Machines) → containers → Kubernetes → serverless",
     detail:{
       what:"The abstraction layer for running your code. VMs (Virtual Machines): full OS, slow to start (minutes), simplest mental model. Containers: shared kernel, fast (seconds), portable. Kubernetes: container orchestrator that manages thousands of containers across many machines. Serverless (Lambda (AWS serverless computing), Cloud Functions): you give a function, the platform handles everything else, charged per millisecond.",
       why:"Each model has a sweet spot. Serverless wins at low/spiky scale (zero ops, pay per use, scales to zero) but becomes 5–10× more expensive than containers at sustained load. Containers (ECS (Elastic Container Service), Cloud Run) win at moderate scale — easy ops, predictable cost. Kubernetes wins past ~30 services where you need fine-grained control and self-healing. VMs (Virtual Machines) survive only for legacy or special hardware needs.",
       numbers:"Cost crossover: serverless ≈ container at ~30% utilization; below that serverless wins, above it containers win. Lambda (AWS serverless computing): $0.20/M requests + $0.0000167/GB-sec. ECS (Elastic Container Service) Fargate: ~$0.04/vCPU-hour. Self-managed K8s (Kubernetes): ~50% cheaper than Fargate but adds a platform team. Container cold start: <100ms. Lambda (AWS serverless computing) cold start: 100ms–5s depending on language and package size."
     },
     tradeoffs:[
       {axis:"Compute abstraction",left:"Serverless (Lambda, Cloud Run): zero ops, cold starts of 100ms–2s, opaque runtime",right:"VMs / bare metal: pick the kernel, mount the disk, debug with strace; you own patching and on-call"},
       {axis:"Cost curve",left:"Serverless: $0 idle, expensive past ~1M requests/day per function",right:"Containers / VMs: pay for capacity even when idle, much cheaper past sustained load"}
     ],
     pitfalls:[
       {name:"Lambda (AWS serverless computing) for high-throughput sustained workloads",desc:"At 1000 RPS sustained, Lambda (AWS serverless computing) costs ~10× a single container. Lambda (AWS serverless computing) is for spiky/idle workloads. If your service runs 24/7 at meaningful load, container it."},
       {name:"Kubernetes at small scale",desc:"3 engineers + 5 services + Kubernetes = 80% of time on infra, 20% on product. K8s (Kubernetes) pays off only at 30+ services or >500 engineers. Use ECS (Elastic Container Service)/Cloud Run until you're sure you've outgrown them."},
       {name:"Long Lambda (AWS serverless computing) cold starts in user path",desc:"Lambda (AWS serverless computing) cold start of 2s on a 100ms-SLO API. Your p99 is now 2000ms whenever a new instance starts. Use provisioned concurrency or move to containers for latency-critical paths."},
       {name:"Forgetting graceful shutdown",desc:"Container kills mid-request because deploy/autoscale signaled SIGTERM (termination signal). User sees error. Always handle SIGTERM (termination signal): stop accepting new requests, drain in-flight, exit (typically 30s grace period)."}
     ],
     examples:[
       {name:"Coca-Cola Super Bowl ad on Lambda (AWS serverless computing)",desc:"Drove 100K+ requests/sec in 30 seconds. Lambda (AWS serverless computing) scaled instantly, cost ~$1K for the burst. Same on EC2 would have required pre-warming 200 instances at much higher cost."},
       {name:"Pinterest moving off K8s (Kubernetes) for some workloads",desc:"Found Kubernetes overhead wasn't worth it for simple stateless services. Moved them to ECS (Elastic Container Service) Fargate. Lesson: K8s (Kubernetes) isn't always the answer at scale either; use the simplest option that meets requirements."}
     ],
     sizes_cfg:{
       small:{range:"1–3 servers or serverless",rec:"Managed PaaS (Railway, Render, Fly.io, Heroku). Or serverless (Lambda (AWS serverless computing), Cloud Functions). Zero infra ops. Focus on product. Containerize from day 1 for portability.",tools:["Railway","Render","Fly.io","AWS Lambda (AWS serverless computing)","Vercel","Heroku"]},
       medium:{range:"3–30 containers",rec:"Docker + managed container service (ECS (Elastic Container Service), Cloud Run, App Engine). Auto-scaling by CPU/RPS. Health checks. Centralized logging. No Kubernetes yet — it's overkill.",tools:["AWS ECS (Elastic Container Service) Fargate","Google Cloud Run","Azure Container Apps","docker-compose"]},
       large:{range:"30–5000 containers",rec:"Kubernetes. HPA (Horizontal Pod Autoscaler) (horizontal pod autoscaler) on CPU + custom metrics. Node autoscaler. Multiple node pools (spot for batch, on-demand for production). GitOps deployment.",tools:["EKS","GKE","AKS","Helm","ArgoCD","KEDA for event-driven scaling"]},
       hyper:{range:">5000 containers, multi-region",rec:"Kubernetes multi-cluster (fleet management). Custom autoscaling with ML-based traffic prediction. Spot instances for 60–80% cost reduction. Cell-based deployment for blast radius. Dedicated bare metal for latency-critical paths.",tools:["Kubernetes Federation","Google Borg-inspired custom","Mesos","Nomad","bare metal + DPDK"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">3 servers to manage or needing CI/CD",action:"Containerize. Move to ECS (Elastic Container Service)/Cloud Run. Add auto-scaling policy (scale on CPU >70%)."},
       {from:"medium",to:"large",trigger:">30 containers or complex service dependencies",action:"Kubernetes. HPA (Horizontal Pod Autoscaler). GitOps. Service mesh for observability."},
       {from:"large",to:"hyper",trigger:">5000 pods or multi-region orchestration needed",action:"Multi-cluster Kubernetes. ML-based autoscaling. Spot fleet management."}
     ],
     children:[]},

    {name:"Load Balancing",id:"compute-lb",icon:"⚖️",phase:"Compute",color:"#059669",
     sizes:["small","medium","large","hyper"],short:"DNS round-robin → L4 → L7 → global anycast",
     detail:{
       what:"A load balancer is the traffic cop in front of your servers — it accepts incoming requests and decides which backend instance handles each one. L4 (transport layer) operates on TCP connections — fast, simple, can't see HTTP. L7 (application layer) understands HTTP, can route by path/header/cookie, do SSL termination, retry on failures. Global LB routes by user geography to the nearest region.",
       why:"Without a load balancer, a single server crash = total outage. With one, that server is removed from rotation in seconds while others absorb the load. The LB also enables zero-downtime deploys (drain old instances, add new ones), canary releases (route 1% to new version), and A/B tests (5% to variant B). It's the primary mechanism by which a system stops being fragile.",
       numbers:"L4 LB throughput: 1–10M connections/sec per node. L7 LB: 100K–1M RPS per node. Health check interval: 5–30s typical; failure threshold 2–3 consecutive misses (so a node is removed within ~15s of failure). DNS-based routing: TTL 60s = up to 60s for failover. Anycast routing: failover in <1s via BGP withdrawal."
     },
     tradeoffs:[
       {axis:"Load balancer layer",left:"L4 (TCP/UDP): forwards bytes, sub-ms overhead, no application awareness",right:"L7 (HTTP): routes by path/header/cookie, can rewrite, terminates SSL, +0.5–2ms per request"},
       {axis:"LB scope",left:"Anycast / global LB: each user hits the closest PoP; complex BGP and health-routing setup",right:"Regional LB per region: simple to reason about, users are pinned to one region per request"}
     ],
     pitfalls:[
       {name:"Round-robin distribution with sticky workloads",desc:"Round-robin sends requests to instances in turn. If one user makes 90% of the heavy queries (e.g., a big tenant), one instance gets crushed while others idle. Use least-connections or latency-weighted distribution."},
       {name:"Health check that's too lightweight",desc:"Health check returns 200 if the process is up — but the DB connection pool is exhausted and real requests fail. Health check must exercise the actual dependencies (DB ping, downstream service ping). Otherwise you keep routing traffic to broken nodes."},
       {name:"No connection draining on deploy",desc:"You shut down an instance with active requests in flight. Users get 502 errors. Always: stop accepting new conns → wait for in-flight to finish (30–60s) → terminate."},
       {name:"DNS-based failover with long TTL",desc:"You configured DNS-based failover but TTL=300s. ISPs and clients cache DNS for 5+ minutes. Real failover takes 5–15 minutes. Use TTL=60s or anycast."}
     ],
     examples:[
       {name:"AWS ALB scaling event (2017)",desc:"Cyber Monday traffic exceeded ALB warmup capacity, customers experienced 5xx errors. AWS now lets customers 'pre-warm' ALBs before known events. LBs themselves have capacity that must be provisioned."},
       {name:"Cloudflare anycast",desc:"Cloudflare announces the same IP from 300+ data centers globally via BGP. A user's packet routes to the nearest one automatically. If a data center fails, BGP convergence redirects in <30s — no DNS, no application code involved."}
     ],
     sizes_cfg:{
       small:{range:"Single server or simple round-robin",rec:"DNS A record pointing to single server. When you add a second server: Nginx upstream or cloud managed LB. Health check every 10s.",tools:["Nginx upstream","AWS ALB","Cloudflare proxy","DigitalOcean LB"]},
       medium:{range:"L7 ALB with path routing",rec:"Cloud ALB with path-based routing. Sticky sessions if stateful (prefer stateless). SSL termination at LB. Health check endpoint /health returning 200.",tools:["AWS ALB","GCP HTTPS LB","Azure Front Door","Traefik"]},
       large:{range:"Multi-tier: global + regional L7",rec:"Global LB (GeoDNS or anycast) routes to closest region. Regional L7 LB routes to service. L4 within service mesh. Connection draining on deploys.",tools:["AWS Global Accelerator","GCP Cloud LB","Cloudflare","Envoy sidecar"]},
       hyper:{range:"Anycast + custom BGP routing",rec:"Anycast IP with BGP announcements from every PoP. Packets routed to nearest PoP by network topology (not DNS). <1ms overhead. Custom health-aware BGP route withdrawal on failures.",tools:["Custom BGP","Cloudflare Anycast","Fastly","custom ECMP routing"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Second server added or failover needed",action:"Cloud managed LB. Health checks. SSL termination. Session management."},
       {from:"medium",to:"large",trigger:"Single-region traffic or failover RTO >5min",action:"Global LB + GeoDNS. Multi-region. Automatic failover."},
       {from:"large",to:"hyper",trigger:"DNS TTL adds latency to failover or global latency SLO",action:"Anycast BGP. Per-PoP LB. Sub-second failover via route withdrawal."}
     ],
     children:[]}
  ]
};
