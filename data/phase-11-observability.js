const PHASE_OBSERVABILITY = {
  name:"Phase 11 · Observability",id:"obs",icon:"🔭",phase:"Observability",color:"#059669",
  sizes:["small","medium","large","hyper"],
  short:"Logs → metrics → tracing → full platform",
  detail:{
    what:"Observability is the ability to ask questions about your system from outside it. It rests on three pillars: logs (timestamped events: 'user 42 logged in'), metrics (numerical aggregates over time: 'CPU at 73%, p99 latency 220ms'), and traces (the path of one request through many services). Together they let you answer 'why is this slow?' or 'why did this fail?' without attaching a debugger to production.",
    why:"You cannot fix what you cannot see. Without observability, an outage is detective work — SSH into machines, grep logs, guess. With it, you have dashboards and alerts that point you at the cause within minutes. The difference between a 5-minute incident and a 5-hour incident is almost entirely observability quality. It also pays for itself in capacity planning (knowing when you'll run out) and feature velocity (catching regressions before customers do).",
    numbers:"SRE rule for SLO alerting: alert when burning the error budget at >2× normal rate over 1 hour (slow burn) OR >14× over 5 minutes (fast burn). Catches both gradual degradation and sudden outages without alerting on every blip. Trace sampling: 100% at small scale, 1–10% at medium, <1% at hyper (storage cost dominates). Metrics cardinality: keep label combinations <1M total or your TSDB (Time Series Database) explodes."
  },
  tradeoffs:[{axis:"Data volume vs Cost",left:"More data: more insight",right:"More data: more cost",pos:0.5},{axis:"Precision vs Overhead",left:"Full tracing: complete picture",right:"Sampling: lower overhead",pos:0.5}],
  pitfalls:[
    {name:"Threshold-based alerting hellscape",desc:"You alert on 'CPU >80%'. CPU spikes during a benign batch job at 3am. On-call gets paged. They tune to 90%. Now real outages don't fire. Use SLO-based alerting (alert on user-impacting error rate / latency, not infrastructure)."},
    {name:"Logs as primary debugging tool at scale",desc:"50 services × 1M req/day = 500M log lines/day. Grep is dead. Move to metrics for known questions and traces for 'why is this request slow.' Logs become evidence, not the primary tool."},
    {name:"High-cardinality labels in metrics",desc:"You add 'user_id' as a Prometheus label. With 10M users you've created 10M time series, your TSDB (Time Series Database) OOMs. Cardinality is the enemy of metrics — use IDs in traces/logs instead."},
    {name:"Alert fatigue",desc:"100 alerts/day, 99 are false. On-call mutes them. The 1 real one is missed. Aggressively delete or fix flaky alerts. If an alert isn't actionable, it shouldn't exist."},
    {name:"No trace context propagation",desc:"You instrument with OpenTelemetry but trace IDs stop at service boundaries. You can see each service's view of the request but not stitch them together. Propagate W3C traceparent header on every call."}
  ],
  examples:[
    {name:"Google's Dapper paper (2010)",desc:"Originated distributed tracing. Showed how to trace single requests across thousands of services using sampling. Inspiration for Zipkin, Jaeger, and OpenTelemetry. Defined the modern observability stack."},
    {name:"Honeycomb's high-cardinality observability",desc:"Built around the insight that interesting questions ('why is this user slow?') need high-cardinality data — exact user IDs, exact request shapes. Traditional metrics (Prometheus) can't do this. Demonstrates the limit of pre-aggregated metrics."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Any production incident takes >1h to diagnose",action:"Add structured logging. Add error tracking (Sentry). Add uptime monitoring."},
    {from:"medium",to:"large",trigger:"Distributed system makes log correlation manual",action:"Add distributed tracing. Centralize logs. Dashboard per service."},
    {from:"large",to:"hyper",trigger:"Alert volume becomes unmanageable",action:"SLO-based alerting. ML anomaly detection. Automated runbooks."}
  ],
  sizes_cfg:{
    small:{range:"Basic logging + error tracking",rec:"Structured JSON logs. Error tracking (Sentry). Uptime monitoring (UptimeRobot). Application performance basic (NewRelic/Datadog free tier). Log retention: 7 days.",tools:["Sentry","UptimeRobot","LogDNA","Papertrail","Datadog free"]},
    medium:{range:"Metrics + structured logs + alerts",rec:"Prometheus for metrics. Grafana dashboards. Structured logs in ELK or Datadog. PagerDuty alerts on SLO breach. Log retention: 30 days. Custom business metrics (conversion, revenue).",tools:["Prometheus + Grafana","Datadog","ELK Stack","PagerDuty","Jaeger (basic tracing)"]},
    large:{range:"Distributed tracing + SLO alerting",rec:"Distributed tracing (Jaeger/Zipkin/Tempo) for every request. SLO-based alerting (not threshold-based). Service dependency maps. Automated incident correlation. Runbook automation.",tools:["Jaeger","Zipkin","Grafana Tempo","Datadog APM","Honeycomb","PagerDuty"]},
    hyper:{range:"Full observability platform",rec:"Custom observability platform. 1% trace sampling (too expensive at 100%). ML-based anomaly detection. Automated incident remediation bots. Real-time capacity heatmaps. SLO budgets enforced in CI/CD pipeline.",tools:["Custom TSDB (Time Series Database)","Prometheus federation","Honeycomb","custom ML alerting","OpenTelemetry"]}
  },
  children:[]
};
