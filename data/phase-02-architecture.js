const PHASE_ARCHITECTURE = {
  name:"Phase 2 · Architecture Style",id:"arch",icon:"🏗️",phase:"Architecture",color:"#7c3aed",
  sizes:["small","medium","large","hyper"],
  short:"Monolith → modular → microservices → platform",
  detail:{
    what:"Architecture style is the high-level decision about how you structure deployable units of code. Monolith: one application, one deploy, one process. Modular monolith: one application but with clear internal boundaries. Microservices: many small services, each owning their own data and deploy. Distributed platform: microservices plus a platform team providing shared infrastructure primitives (compute, deploy pipelines, observability) as self-service.",
    why:"This decision shapes everything: how teams collaborate, how fast you ship, how often things break, how much ops complexity you carry. Microservices are seductive — Netflix and Amazon use them, so we should too! — but they have ~10× the operational overhead of a monolith. They pay off only when you have enough teams and engineers that coordination on a single codebase has become the bottleneck. The right architecture is the simplest one that solves your team and scale problems, not the most sophisticated one.",
    numbers:"Heuristics: <20 engineers → monolith. 20–100 → modular monolith. 100–500 → microservices. >500 → platform engineering. Roughly 1 service per team (Conway's law (organizational structure mirrors system architecture): structure mirrors org). Median microservices org has 50–500 services. The cost of a microservices migration: typically 12–18 months of slowed feature velocity. Don't take that hit until the monolith is genuinely blocking you."
  },
  tradeoffs:[
    {axis:"Architecture style",left:"Monolith: one repo, one deploy, single shared DB; simplest possible ops",right:"Microservices: per-team services with their own stacks and storage; max team independence"},
    {axis:"Deployment coupling",left:"Single deploy unit: ship everything together, easy atomic rollback",right:"Many independent services: each team deploys on its own cadence, coordination becomes the cost"}
  ],
  pitfalls:[
    {name:"Microservices for a 5-person team",desc:"5 engineers + 15 services = each engineer maintaining 3 services they barely understand. Operational overhead crushes feature work. Microservices need team boundaries to make sense; without enough teams, you're paying complexity for no benefit."},
    {name:"Distributed monolith",desc:"You split into services but they all share one DB and call each other synchronously. Now you have all the operational pain of microservices with all the coupling of a monolith — worst of both. Fix: each service owns its data; communicate async where possible."},
    {name:"Premature service extraction",desc:"You extract a 'user service' before the boundaries stabilize. Six months later the product changed and the boundary is wrong; refactoring across services is 10× harder than within a monolith. Prefer modular monolith first; extract only when boundaries are proven."},
    {name:"No platform investment at scale",desc:"500 engineers each reinventing CI/CD, monitoring, deploys. Massive duplication, inconsistent tooling, wasted effort. Past ~100 engineers, dedicated platform engineering pays for itself many times over."},
    {name:"Conway's law (organizational structure mirrors system architecture) ignored",desc:"You design 4 services but have 2 teams. The teams will fight over ownership; one team will dominate, the architecture will degrade. Align service boundaries with team boundaries."}
  ],
  examples:[
    {name:"Shopify's 'majestic monolith'",desc:"Shopify ran one of the world's largest Rails monoliths long past when conventional wisdom said they should split. They invested heavily in modularization (the 'Componentized Monolith') instead. Demonstrates monoliths can scale further than people think with discipline."},
    {name:"Amazon's two-pizza teams + microservices",desc:"Amazon mandated services with one team owning each, in the famous 2002 'API mandate.' Required at Amazon's scale. Note: Amazon had ~5000 engineers when this happened. Don't model your 50-engineer org on Amazon."},
    {name:"Segment's microservices → monolith reversal",desc:"Segment moved 140 microservices back to a monolith because operational overhead exceeded the benefits at their scale and shape. Demonstrates that the 'right' architecture is workload-dependent and reversible."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:">20 engineers or single service >500K LOC (Lines Of Code)",action:"Modularize the monolith. Define bounded contexts. Don't split into services yet."},
    {from:"medium",to:"large",trigger:">100 engineers or deployment becoming bottleneck",action:"Extract highest-traffic services first. Keep shared services as libraries initially."},
    {from:"large",to:"hyper",trigger:">500 engineers or hundreds of services",action:"Platform engineering team. Internal developer platform. Service mesh. Self-service infra."}
  ],
  children:[
    {name:"Monolith",id:"arch-mono",icon:"🧱",phase:"Architecture",color:"#7c3aed",
     sizes:["small"],short:"Single deployable unit — right for small teams",
     detail:{
       what:"All application code lives in one repository, builds into one artifact, deploys as one unit. Internal communication is in-process function calls — no network. State is shared through one database (or a few). One deploy means everything updates atomically.",
       why:"Fastest to start. No network latency between components. Easy to debug (one stack trace), easy to test (one process), easy to deploy (one artifact). The wrong choice only when you have so many engineers that coordinating on the codebase becomes the bottleneck — typically not until 20+ engineers.",
       numbers:"Comfortable upper bounds: ~20 engineers, ~500K LOC (Lines Of Code), 10K RPS, 500GB data. Beyond these, the friction of working in one codebase starts to outweigh the operational simplicity. Plan modularization (not extraction) when you approach these limits."
     },
     tradeoffs:[
       {axis:"Velocity by team size",left:"Small team (≤20 engineers): days from idea to prod, no coordination overhead",right:"Large team (≥100 engineers): merge conflicts, slow CI, code-ownership disputes block velocity"},
       {axis:"Scaling granularity",left:"One artifact, one deploy: simple to release and reason about",right:"Hot path scales together with cold paths: pay to scale the whole thing even if only one feature is loaded"}
     ],
     pitfalls:[
       {name:"Big ball of mud",desc:"No internal boundaries; every file imports every other file. Refactoring is impossible. Avoidable with modules/packages from day 1, even in a monolith."},
       {name:"One slow endpoint kills everything",desc:"A poorly written report endpoint hogs all DB connections; the entire app slows down. Use connection pooling per concern, set timeouts, monitor per-endpoint latency."}
     ],
     examples:[
       {name:"Basecamp's continued monolith",desc:"DHH and Basecamp run a 20-year-old Rails monolith and have been vocal that it's the right choice for their team. Counterpoint to 'monoliths don't scale' — they scale further than fashion suggests."}
     ],
     sizes_cfg:{
       small:{range:"1–20 engineers, <10K RPS",rec:"Use a well-structured monolith with clear internal module boundaries. Avoid premature extraction into services — it will slow you down.",tools:["Rails","Django","Laravel","Express","Next.js (full-stack)"]}
     },
     levelUp:[{from:"small",to:"medium",trigger:">20 engineers OR deploy frequency causing conflicts OR >1K RPS",action:"Modularize internally first. Define bounded contexts. Extract background jobs to a separate process."}],
     children:[]},

    {name:"Modular Monolith",id:"arch-modmono",icon:"📦",phase:"Architecture",color:"#7c3aed",
     sizes:["medium"],short:"Internal modules with clean boundaries",
     detail:{
       what:"Still one deployable unit, but internally divided into well-defined modules with explicit interfaces. Each module owns a bounded context (auth, billing, catalog, payments). Modules communicate through documented APIs, not by reaching into each other's internals. Can be split into independent services later with minimal refactoring because the boundaries already exist.",
       why:"Gives you team autonomy without the operational burden of microservices. Each team owns a module; they can iterate within it freely. Deploy is still one unit (simple) but code is decoupled (fast iteration). The best choice for 20–100 engineers — and many companies stay here much longer.",
       numbers:"Target shape: each module <100K LOC (Lines Of Code), owned by 1–2 teams, with explicit public API at the module boundary. Database can be one cluster but schema-per-module (each module's tables are private). Can support up to ~50K RPS comfortably with proper horizontal scaling of the monolith itself."
     },
     tradeoffs:[
       {axis:"Module discipline",left:"Strict module boundaries enforced by the compiler/linter: harder to write, easy to extract into a service later",right:"No internal boundaries: ships fastest now, painful to split when the team grows past the monolith"},
       {axis:"Future-proofing vs ship speed",left:"Design every module so it could become a service: extra abstraction up front, smooth split later",right:"Optimize for shipping today: lower-friction development, may rewrite at the seam when scaling forces a split"}
     ],
     pitfalls:[
       {name:"Boundaries that leak",desc:"Module A's internals get imported from module B 'just this once.' A year later they're hopelessly entangled and you can't extract A. Enforce boundaries with linting / architecture tests (e.g., ArchUnit, dependency-cruiser)."},
       {name:"Shared database tables across modules",desc:"Two modules write to the same table; coupling is invisible until you try to extract one. Schema-per-module keeps the option open."}
     ],
     examples:[
       {name:"Shopify's componentized monolith",desc:"Migrated their 5M-line Rails monolith into ~100 components with enforced boundaries. Each component team owns its slice. Most are still in the same deploy; some have been extracted to services. Demonstrates the path: modularize first, extract only when needed."}
     ],
     sizes_cfg:{
       medium:{range:"20–100 engineers, 1K–50K RPS",rec:"Group code by bounded context (e.g. auth, billing, core domain). Use internal APIs between modules. Share DB but use schema-per-module.",tools:["Java modules","Rails engines","Django apps","Go packages","NestJS modules"]}
     },
     levelUp:[{from:"medium",to:"large",trigger:">100 engineers OR modules deploying at different rates OR DB becoming bottleneck",action:"Extract highest-scale modules into separate services. Start with stateless services. Introduce an API gateway."}],
     children:[]},

    {name:"Microservices",id:"arch-micro",icon:"🔧",phase:"Architecture",color:"#7c3aed",
     sizes:["large"],short:"Independent services with API contracts",
     detail:{
       what:"The system is split into many independently deployable services. Each service: owns its data store (no shared DB), runs in its own process(es), is owned by one team, exposes a contract (REST/gRPC), deploys on its own pipeline. Services communicate over the network — sync (RPC) or async (events).",
       why:"At sufficient scale, the bottleneck is not technology but human coordination. Microservices let 100+ teams ship independently — Team A's deploy doesn't block Team B. Failures are isolated (one service crashing doesn't take everything down). Each service can scale independently. The cost: every internal call is now a network call (latency, failure modes), every service needs its own deploy pipeline, and you've created a distributed system with all that entails.",
       numbers:"Median microservices org: 50–500 services. Each service: 1–3 engineers, 10K–100K LOC (Lines Of Code). Service count grows with team count, not user count: 100 engineers → ~30 services typical. Network overhead: each cross-service call adds 1–5ms. A request that fans out to 10 services has ~30ms of network alone."
     },
     tradeoffs:[
       {axis:"Team autonomy vs ops cost",left:"Per-team deploys, polyglot stacks, independent on-call: max independence and ownership",right:"Service mesh, shared observability, multiple on-call rotations: heavy ops surface and platform investment"},
       {axis:"Failure isolation vs latency",left:"Service boundaries contain blast radius: a bug in one service can't crash others",right:"Each call is a network hop: 1–5ms each, adds up across deep call chains"}
     ],
     pitfalls:[
       {name:"Too many services per team",desc:"5 engineers, 20 services = each service is undermaintained. Aim for 1–3 services per team."},
       {name:"Synchronous chains 5+ hops deep",desc:"A → B → C → D → E synchronously. Any one slowness multiplies. Use async events or fewer, larger services."},
       {name:"No service catalog / ownership",desc:"At 200 services, nobody knows who owns service X. When it breaks at 3am, who gets paged? Maintain a service catalog (Backstage, custom) with ownership, SLOs, runbooks."}
     ],
     examples:[
       {name:"Netflix's 700+ microservices",desc:"Famous example. Each service is owned by a small team with full operational responsibility. Required massive investment in tooling: Hystrix, Eureka, Spinnaker, Atlas, etc. Microservices at this scale isn't free — Netflix has hundreds of platform engineers building the substrate."},
       {name:"Twitter's monolith → microservices → re-consolidation",desc:"Famously moved off Ruby monolith ('fail whale' era) to JVM microservices in early 2010s. Solved scale problems but created sprawl. Recent X-era moves have re-consolidated some services. Demonstrates the cycle isn't always one-way."}
     ],
     sizes_cfg:{
       large:{range:"100–500 engineers, 50K–500K RPS",rec:"Each service: 1 team, 1 repo, 1 data store, 1 deployment pipeline. Service mesh for observability. API gateway for external traffic. Event bus for async communication.",tools:["Kubernetes","Istio","Envoy","gRPC","Kafka","Kong"]}
     },
     levelUp:[{from:"large",to:"hyper",trigger:">500 engineers OR >1000 services OR internal platform becoming bottleneck",action:"Platform engineering team. Internal developer platform. Self-service infra. Service catalog. Ownership enforcement."}],
     children:[]},

    {name:"Distributed Platform",id:"arch-platform",icon:"🌐",phase:"Architecture",color:"#7c3aed",
     sizes:["hyper"],short:"Platform engineering + cell architecture",
     detail:{
       what:"A platform team provides infrastructure primitives (compute, storage, networking, deployment, observability, secrets) as self-service products that product teams consume. Cell architecture deploys identical full-stack copies serving N% of users each, so a bad deploy or rogue tenant in one cell can't take down the whole system.",
       why:"At hyper scale, every team building their own infra is wasteful and dangerous. The platform team's products (deploy pipeline, service template, observability stack) save thousands of engineer-hours and enforce safety properties (security, observability) by default. Cells contain blast radius — a 1% bad cell affects 1% of users, not 100%. Both are required at scale; neither is needed at small scale.",
       numbers:"Platform team sizing: ~1 platform engineer per 8–12 product engineers. Cell sizing: each cell typically 1–10% of total capacity, with N+2 cells (so losing 2 still leaves capacity). Self-service: a new service should go from 'idea' to 'deployed in prod with monitoring/alerting' in <1 day for the team."
     },
     tradeoffs:[
       {axis:"Standardization vs team freedom",left:"Platform-mandated stacks and templates: consistent ops, easier mobility, slower to adopt new tech",right:"Teams choose any language, framework, runtime: max flexibility, fragmented tooling and on-call playbooks"},
       {axis:"Cell isolation vs complexity",left:"Per-cell shards (each cell = isolated copy of stack): one outage hits 1/N of users",right:"No cell boundary: simpler topology, an outage takes down the entire customer base"}
     ],
     pitfalls:[
       {name:"Platform team builds for hypothetical needs",desc:"Six months building a 'flexible deploy framework' nobody uses. Always: platform built from real product team pain, with product teams as customers. Treat platform as a product."},
       {name:"Cells without isolation",desc:"You call them 'cells' but they share a global DB or auth service. A failure in that shared component takes down all 'cells.' True cells share nothing — full stack copies."},
       {name:"Platform becomes a gatekeeper",desc:"Every infra change requires a ticket to the platform team; they're 6 weeks behind. Platform's job is to make product teams faster, not approve their changes. Self-service is the contract."}
     ],
     examples:[
       {name:"AWS itself (cells)",desc:"AWS services are deployed in cells per region per AZ. A cell-level outage (e.g., a single Lambda cell) affects a small subset of users. Cells are also why some AWS outages are 'partial' — only one cell of the affected service was down."},
       {name:"Google's Borg → Kubernetes lineage",desc:"Google built Borg in early 2000s as their internal compute platform. K8s was the open-source descendant. Demonstrates that platform engineering at scale births industry standards — and that the investment is multi-year."},
       {name:"Spotify's Backstage developer portal",desc:"Internal portal Spotify built for service catalog, ownership, docs, deploys. Open-sourced 2020, now widely adopted. Demonstrates the value of a unified platform interface."}
     ],
     sizes_cfg:{
       hyper:{range:">500 engineers, >500K RPS",rec:"Internal developer platform with self-service infra. Cell-based deployment (each cell = full stack copy for N% of users). Chaos engineering as standard practice. Multi-region active-active.",tools:["Backstage (developer portal)","Terraform modules","Kubernetes operators","custom control planes"]}
     },
     levelUp:[],
     children:[]}
  ]
};
