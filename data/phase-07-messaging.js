const PHASE_MESSAGING = {
  name:"Phase 7 · Messaging & Async",id:"msg",icon:"📨",phase:"Messaging",color:"#7c3aed",
  sizes:["small","medium","large","hyper"],
  short:"Sync → job queue → message broker → event streaming",
  detail:{
    what:"Messaging is infrastructure for asynchronous communication: a producer drops a message into a queue/topic/stream and a consumer picks it up later. Producer and consumer don't have to be online at the same time, don't need to know about each other, and scale independently. Forms span simple job queues (Sidekiq, SQS) to durable event streams (Kafka (event streaming platform), Kinesis).",
    why:"Synchronous everything is brittle — a 200ms request that calls 5 downstream services synchronously fails if any one is slow. Async decouples: drop the message, return success, process in background. You get load leveling (queue absorbs spikes), retry-on-failure, independent scaling, and audit trails. Cost: eventual consistency, idempotency, ordering, and dead-letter handling become your problems.",
    numbers:"Rule of thumb: anything >200ms that the user doesn't need synchronously should be async. Throughput: SQS ~3K msg/sec/queue, RabbitMQ ~50K, Kafka (event streaming platform) 100K–10M. Latency: queue write 1–10ms, consumer pickup 10–100ms typical. Critical metric to monitor: consumer lag (oldest-message-age). Growing lag means consumer capacity problem, not a queue problem."
  },
  tradeoffs:[
    {axis:"Communication style",left:"Synchronous RPC: caller waits for the response, easy to debug a single trace, tight runtime coupling",right:"Async via queue/topic: producer fires and forgets, consumers scale independently, plumbing complexity"},
    {axis:"Ordering guarantees",left:"Strict ordering on a single partition/queue: serial processing, easy reasoning, throughput capped at one consumer",right:"No ordering guarantee: parallel consumers, high throughput, harder to maintain per-key invariants"}
  ],
  pitfalls:[
    {name:"Non-idempotent consumers",desc:"At-least-once delivery means messages may be delivered twice. If your consumer charges a credit card on each message, duplicates = double charges. Always make consumers idempotent (use a unique message ID; check 'already processed?' before acting)."},
    {name:"Dead-letter queue ignored",desc:"Failed messages go to DLQ (Dead Letter Queue) but no one watches it. Months later, the DLQ (Dead Letter Queue) has 100K messages representing real lost work. Always alert on DLQ (Dead Letter Queue) depth >0; have a process to inspect and replay."},
    {name:"Tight coupling via message schema",desc:"Producer adds a required field to message; old consumers fail to parse. Use schema registry (Avro/Protobuf) with backward-compatibility rules. Treat message schemas like APIs."},
    {name:"Unbounded retry storms",desc:"Consumer fails → message returns to queue → consumer fails again → infinite retry. Always set max retry count; route to DLQ (Dead Letter Queue) after N failures (typically 3–5)."}
  ],
  examples:[
    {name:"Stripe's idempotency keys + queue",desc:"Every webhook delivery includes an idempotency key. Stripe retries up to 3 days with exponential backoff. Customers' consumers must be idempotent — Stripe explicitly designs for at-least-once. Documented as the API standard."},
    {name:"LinkedIn Kafka (event streaming platform) origin",desc:"Built Kafka (event streaming platform) because their site activity tracking needed to fan out to many consumers (search index, recommendations, analytics) without coupling them. Now ingests trillions of events/day. Demonstrates the value of a durable log over point-to-point queues."}
  ],
  levelUp:[],
  children:[
    {name:"Async Pattern",id:"msg-pattern",icon:"🔄",phase:"Messaging",color:"#7c3aed",
     sizes:["small","medium","large","hyper"],short:"None → background jobs → MQ → event streaming",
     detail:{
       what:"The pattern by which work is deferred from the request path. Background jobs: simple, in-process queue (Sidekiq, Celery) backed by Redis. Message queue: dedicated service (SQS, RabbitMQ) that holds messages and delivers to consumers; messages disappear once acknowledged. Event streaming (Kafka (event streaming platform), Kinesis): durable log; multiple consumers can replay from any point; messages persist for days/weeks.",
       why:"Each pattern fits a different need. Background jobs: simplest, perfect for 'send this email' kind of work. MQ: when producer and consumer are different services and you need reliable delivery + DLQ (Dead Letter Queue). Event streaming: when multiple downstream systems need the same events (search index, analytics, recommendations) or when you need event sourcing / replay. Picking too heavyweight = complexity tax; too lightweight = re-implementing missing features.",
       numbers:"Rule for offloading: take async anything >200ms in the user path that doesn't need synchronous result. Sidekiq job overhead: ~1ms enqueue, ~2ms pickup. SQS: 5–50ms end-to-end. Kafka (event streaming platform): <10ms producer-to-consumer at low volume, ~30–100ms at scale. Replay capability: SQS no, Kafka (event streaming platform) yes (within retention window — usually 7 days)."
     },
     tradeoffs:[
       {axis:"Failure handling",left:"Sync call: caller learns of failure immediately and must retry from the original context",right:"Async via durable queue: failed work stays queued, consumer retries automatically, dead-letter queue for poison pills"},
       {axis:"Throughput vs ordering",left:"Unordered with many partitions: millions of msgs/sec, no per-key ordering",right:"Ordered per partition: ~10–50K msgs/sec per partition, FIFO within key"}
     ],
     pitfalls:[
       {name:"Using Kafka (event streaming platform) when SQS would do",desc:"Kafka (event streaming platform) adds operational complexity (Zookeeper, partition management, consumer group coordination). At <10K msg/sec you don't need it. Use SQS or RabbitMQ until you have an actual reason for Kafka (event streaming platform) (replay, multiple consumers, ordering at scale)."},
       {name:"Background job DB updates without idempotency",desc:"Job that increments a counter runs twice on retry → counter is wrong. Use upserts with unique IDs, or atomic operations, or check-then-act with versioning."},
       {name:"Long-running jobs blocking workers",desc:"A 5-minute job ties up a worker; the queue backs up. Either: split into smaller jobs, or run long jobs on a separate worker pool with different concurrency."}
     ],
     examples:[
       {name:"Shopify Sidekiq at scale",desc:"Runs billions of background jobs/day on Sidekiq + Redis. Demonstrates that simple job queues scale very far before you need Kafka (event streaming platform). Ops simpler than Kafka (event streaming platform) by an order of magnitude."},
       {name:"Uber's event sourcing on Kafka (event streaming platform)",desc:"Every trip event (request, accept, pickup, drop-off) goes to Kafka (event streaming platform). Multiple consumers: pricing, analytics, fraud detection, support tooling. Replay enables debugging — 'show me everything that happened to this trip.'"}
     ],
     sizes_cfg:{
       small:{range:"Cron jobs + inline async tasks",rec:"Use background job library in your framework. Sidekiq (Ruby), Celery (Python), Bull (Node). Simple Redis-backed queue. Don't over-engineer with a separate MQ service.",tools:["Sidekiq","Celery","Bull/BullMQ","Delayed::Job"]},
       medium:{range:"Dedicated message queue service",rec:"SQS for simple task queues (at-least-once delivery). SNS for fan-out. Dead-letter queues for failed jobs. Visibility timeout = max processing time × 2. Monitor DLQ (Dead Letter Queue) depth.",tools:["AWS SQS","RabbitMQ","Azure Service Bus","GCP Pub/Sub"]},
       large:{range:"Message broker with guaranteed delivery",rec:"RabbitMQ or Kafka (event streaming platform) for complex routing, ordering guarantees, consumer groups. Kafka (event streaming platform) for high-throughput event streaming. At-least-once + idempotent consumers = exactly-once semantics.",tools:["Apache Kafka (event streaming platform)","RabbitMQ","AWS MSK","Confluent Platform","Pulsar"]},
       hyper:{range:"Event streaming platform",rec:"Kafka (event streaming platform) at massive scale: 1M–10M events/sec per cluster. Multi-datacenter replication (MirrorMaker 2). Schema registry for contract evolution. Event sourcing for audit trail and rebuilding read models.",tools:["Kafka (event streaming platform) (self-managed)","Confluent Cloud","AWS Kinesis","custom event bus","Apache Flink for stream processing"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">1K background jobs/day or job failures causing data loss",action:"Dedicated job queue with persistence and DLQ (Dead Letter Queue). Monitor job duration and failure rate."},
       {from:"medium",to:"large",trigger:">100K messages/day or ordering required or fan-out needed",action:"Kafka (event streaming platform) or RabbitMQ. Consumer groups. DLQ (Dead Letter Queue). Reprocessing capability."},
       {from:"large",to:"hyper",trigger:">1M events/sec or event sourcing required or global fan-out",action:"Kafka (event streaming platform) cluster. Schema registry. Multi-DC replication. Stream processing (Flink)."}
     ],
     children:[]}
  ]
};
