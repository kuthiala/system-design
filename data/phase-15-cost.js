const PHASE_COST = {
  name:"Phase 15 · Cost Optimization",id:"cost",icon:"💰",phase:"Cost",color:"#059669",
  sizes:["small","medium","large","hyper"],
  short:"Right-size → reserved → spot → FinOps team",
  detail:{
    what:"FinOps is the discipline of managing cloud spend like you manage engineering: with visibility, accountability, and continuous optimization. Tactically it covers right-sizing instances, choosing the right pricing model (on-demand, reserved, savings plans, spot), lifecycle policies for storage, eliminating waste (idle resources, over-provisioned services), and architectural choices that scale cost sub-linearly with usage.",
    why:"Cloud bills compound. A startup spending $10K/month at year 1 can hit $1M/month by year 3 if growth is unmanaged — and 30–40% of that is typically waste (idle dev environments, over-provisioned production, storage no one needs). Treating cost as 'someone else's problem' (the CFO's) means engineering decisions are made without visibility into their financial consequences. FinOps culture treats cost as a first-class engineering metric — alongside latency, error rate, and uptime — and reduces bills by 30–60% without performance regression.",
    numbers:"Savings stack: reserved instances / savings plans = 30–60% off on-demand for 1–3y commit. Spot instances = 60–90% off but interruptible (good for batch, ML, stateless). Right-sizing typically finds 20–30% savings (instances at <30% utilization). Storage lifecycle = 70–90% off for cold data moved to Glacier. Combined: a typical optimization project cuts bills 40–50% without changing the application."
  },
  tradeoffs:[
    {axis:"Compute purchase model",left:"Spot / preemptible: 60–90% off, reclaimed in 30s, only for interruption-tolerant work",right:"On-demand / reserved: full price, stable runtime, predictable for critical services"},
    {axis:"Cost optimization approach",left:"Manual right-sizing per workload: deep wins, ongoing eng effort to maintain",right:"Auto-optimizer (Compute Optimizer, Karpenter): decent savings, zero eng time"}
  ],
  pitfalls:[
    {name:"No tagging strategy",desc:"You can't tell which team / feature / customer is causing the bill. The CFO asks 'why is AWS up 40%?' and engineering can't answer. Tag everything (team, service, environment, cost-center) from day 1; enforce in CI/CD."},
    {name:"Idle non-prod environments",desc:"50 developer environments running 24/7. They're used 9-5 weekdays — that's 70% wasted runtime. Auto-shutdown nights/weekends saves 60% on non-prod immediately."},
    {name:"Cross-AZ / cross-region data transfer",desc:"Microservices chatter freely across AZs. AWS charges $0.01/GB cross-AZ — sounds cheap until your services exchange 100TB/month and that's $1K of pure waste. Co-locate chatty services; cache cross-region calls."},
    {name:"Reserved instances for variable workloads",desc:"You bought 3-year RIs for everything to save 60%. Then you migrated to ARM and the RIs don't apply. Use Savings Plans (compute-flexible) or short-term commitments for evolving infra."},
    {name:"Forgotten resources",desc:"EBS volumes detached from terminated instances, $1K/month each. Old snapshots from 5 years ago. Unused Elastic IPs ($3.65/month each). NAT Gateways in dev ($35/month each, 24/7). Run cost anomaly detection; periodically audit."},
    {name:"Egress lock-in",desc:"AWS egress is $0.09/GB; $90/TB. At 1PB/month that's $90K. By the time you notice, multi-cloud is harder. Use Cloudflare R2 or other zero-egress providers for bandwidth-heavy storage."}
  ],
  examples:[
    {name:"Pinterest saving $100M+ on AWS",desc:"Multi-year FinOps program: spot instances for batch (90% saving), Graviton for general compute (20% cheaper + faster), aggressive right-sizing, custom autoscaling. Reduced unit costs by half while doubling traffic."},
    {name:"DropBox 'Magic Pocket' (off cloud)",desc:"Migrated 90% of data off S3 to their own datacenters over 2 years. Saved hundreds of millions. Demonstrates that at extreme scale, the cloud's price premium becomes worth replacing — but only at extreme scale."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Cloud bill >$5K/month",action:"Reserved instances for predictable load. Turn off non-prod nights/weekends."},
    {from:"medium",to:"large",trigger:"Cloud bill >$100K/month",action:"FinOps practice. Cost per feature. Spot for batch. Savings plans."},
    {from:"large",to:"hyper",trigger:"Cloud bill >$1M/month",action:"Dedicated FinOps team. Reserved capacity. Multi-cloud for pricing leverage."}
  ],
  sizes_cfg:{
    small:{range:"<$5K/month — just get it right",rec:"Use free tiers aggressively. Turn off dev/staging on weekends (save 60%). Choose right-sized instances. Use spot/preemptible for non-critical jobs.",tools:["AWS Compute Optimizer","Infracost","cloud cost explorer"]},
    medium:{range:"$5K–$100K/month",rec:"1-year reserved instances for production (30–40% discount). Spot for batch/ML workloads. S3 Intelligent Tiering for storage. Auto-scaling to minimize idle time.",tools:["AWS Savings Plans","GCP Committed Use","Spot instances","CAST AI","Infracost"]},
    large:{range:"$100K–$1M/month",rec:"FinOps practice. Cost allocated per team/feature. 3-year reserved for stable base load. Spot fleet for 60–80% of flexible compute. Architect for cost efficiency (fewer N+1 queries, better caching).",tools:["CloudHealth","Apptio Cloudability","AWS Cost Explorer","Kubecost","Spot.io"]},
    hyper:{range:">$1M/month — dedicated FinOps",rec:"Multi-cloud for pricing leverage. Custom hardware (TPUs, custom ASICs like Google TPU or Amazon Trainium). Colocation for predictable workloads (2–5× cheaper than cloud). Spot fleet automation. Real-time cost dashboards per team.",tools:["Custom FinOps tooling","multi-cloud arbitrage","bare metal colocation","custom silicon"]}
  },
  children:[]
};
