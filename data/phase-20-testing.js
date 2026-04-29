const PHASE_TESTING = {
  name:"Phase 20 · Testing Strategy",id:"test",icon:"🧪",phase:"Testing",color:"#fb923c",
  sizes:["small","medium","large","hyper"],
  short:"Unit → integration → load → chaos → continuous verification",
  detail:{what:"The portfolio of tests that gives confidence to deploy: correctness (unit/integration), capacity (load), resilience (chaos), contracts (consumer-driven), and production verification (canary metrics).",
    why:"Test pyramid is wrong at scale: in distributed systems, integration & contract tests catch the bugs that matter. Unit tests prove your code works in isolation; production proves it works under reality.",
    numbers:"DORA elite teams: change failure rate <15%. Achievable only with: contract tests, automated load tests in CI, chaos engineering, and progressive delivery."},
  tradeoffs:[
    {axis:"Test suite scope",left:"High coverage with E2E + integration: catches real bugs, 30–60min CI",right:"Unit + smoke only: 2–5min CI, more bugs leak to prod"},
    {axis:"Bug discovery environment",left:"Pre-prod (staging, perf env): safe, never quite matches prod scale",right:"Prod (chaos engineering, canaries): realistic, real users feel failures"}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:">5 engineers or >1 prod incident from missed test",action:"Add integration tests on critical paths. Contract tests between services. CI gates on test pass."},
    {from:"medium",to:"large",trigger:">50 services or any cascading failure incident",action:"Load tests in CI. Chaos engineering monthly. Canary deploys with auto-rollback."},
    {from:"large",to:"hyper",trigger:">500 services or zero-tolerance reliability",action:"Continuous chaos in prod. Formal verification of critical algorithms (TLA+). Synthetic monitoring from every PoP."}
  ],
  children:[
    {name:"Load & Capacity",id:"test-load",icon:"📊",phase:"Testing",color:"#fb923c",
     sizes:["medium","large","hyper"],short:"k6/Locust → distributed → game days",
     detail:{what:"Tests that verify your system handles the projected (and 2–10× projected) load without breaking SLOs.",
       why:"Capacity bugs only appear under load and are too expensive to discover in production. Load test before launch and quarterly thereafter.",
       numbers:"Test at: 1×, 2×, 5× projected peak. Find your knee (point where latency goes nonlinear). Provision at 60% of knee for headroom."},
     tradeoffs:[
       {axis:"Load test data source",left:"Production data snapshot: realistic edge cases, PII handling required",right:"Synthetic generator (Faker, factories): no PII risk, misses real-world data shapes"}
     ],
     sizes_cfg:{
       medium:{range:"Single-machine load gen",rec:"k6 or Locust scripts. Run pre-launch. Use prod-like data shapes (anonymized). Monitor SLOs during test.",tools:["k6","Locust","Artillery","Vegeta"]},
       large:{range:"Distributed load + replay",rec:"Distributed load gen (k6 cloud, Locust workers). Traffic replay (capture prod, replay 10×). Weekly load tests against staging.",tools:["k6 Cloud","Locust distributed","GoReplay","Tsung"]},
       hyper:{range:"Continuous load in prod (shadow)",rec:"Shadow traffic (mirror to staging). Load tests in prod cells with isolation. Game days simulating black-friday-class events.",tools:["AWS shadow LB","Envoy traffic mirroring","custom replay","game day playbooks"]}
     },
     levelUp:[],
     pitfalls:[
       {name:"Single-keyspace load test",desc:"Hammering 1 user_id will hit cache; real users hit 1000s of different keys. Use production key distribution."},
       {name:"Forgetting backend",desc:"Load test the API but not the DB. Most outages: DB is the bottleneck. Test full stack."}
     ],
     related:[{id:"req-traffic",label:"Traffic & Scale"}],
     children:[]},

    {name:"Chaos Engineering",id:"test-chaos",icon:"🐒",phase:"Testing",color:"#fb923c",
     sizes:["large","hyper"],short:"Inject failures · validate resilience",
     detail:{what:"Deliberately inject failures (kill instances, partition network, slow disk) to validate that your resilience mechanisms work.",
       why:"Failures will happen in prod. Chaos engineering ensures the failure modes you've designed for actually work. The first time you test failover should NOT be during a real outage.",
       numbers:"Start in staging weekly. Move to prod monthly with blast radius limits (single AZ first, then region). Measure MTTD + MTTR per chaos run."},
     tradeoffs:[
       {axis:"Chaos environment",left:"Chaos in prod: real failure modes, real user impact during the test window",right:"Chaos in staging only: safe, doesn't reproduce prod-specific failure modes"}
     ],
     sizes_cfg:{
       large:{range:"Monthly chaos in staging + game days",rec:"Chaos Monkey style: random instance kills. Latency injection. Network partitions. Build chaos into CI for known failure modes.",tools:["Chaos Mesh","Litmus","AWS FIS","Gremlin","Chaos Monkey"]},
       hyper:{range:"Continuous chaos in prod",rec:"Always-on low-rate chaos in prod (e.g., 0.01% requests get 100ms latency injection). Weekly major drills. Automated GameDays.",tools:["Custom chaos platform","Gremlin Enterprise","AWS FIS at scale"]}
     },
     levelUp:[],
     examples:[
       {name:"Netflix Chaos Monkey",desc:"Originated the practice. Random EC2 termination during business hours forced engineers to design for resilience."},
       {name:"AWS GameDay",desc:"Annual region-failure simulation. Engineers practice failover before they need it."}
     ],
     related:[{id:"reliability",label:"Reliability"}],
     children:[]},

    {name:"Contract Testing",id:"test-contract",icon:"🤝",phase:"Testing",color:"#fb923c",
     sizes:["medium","large","hyper"],short:"Producer/consumer-driven contracts",
     detail:{what:"Tests that verify the API contract between two services without requiring full integration. Producer publishes contract; consumer verifies.",
       why:"In a microservices world, end-to-end tests are flaky and slow. Contract tests give 90% of integration value at 1% of the cost.",
       numbers:"Pact-style: ~5x faster than e2e tests. Catches the most common bug (breaking API change deployed independently)."},
     tradeoffs:[
       {axis:"Cross-service tests",left:"Contract tests (Pact): lightweight, run per-service, miss integration drift",right:"End-to-end tests across all services: thorough, brittle, 10–30min per run"}
     ],
     sizes_cfg:{
       medium:{range:"Pact between key services",rec:"Pact for HTTP contracts. Schema registry for events (Avro/Protobuf). Producer can't deploy if it breaks consumer's contract.",tools:["Pact","Pactflow","Buf schema registry","Confluent Schema Registry"]},
       large:{range:"Contract registry + compatibility CI gate",rec:"Centralized contract registry. CI gate blocks breaking changes. Consumer-driven contracts for critical paths.",tools:["Pactflow","Buf","Apicurio","custom registry"]},
       hyper:{range:"Schema evolution automation",rec:"Auto-generated client SDKs from schemas. Compatibility checking in CI for backward + forward compat. Blue/green for breaking changes.",tools:["Buf","custom SDK gen","schema compatibility bots"]}
     },
     levelUp:[],
     related:[{id:"api-proto",label:"Protocol Selection"}],
     children:[]}
  ]
};
