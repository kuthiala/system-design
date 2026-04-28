const PHASE_API = {
  name:"Phase 3 · API Design",id:"api",icon:"🔌",phase:"API Layer",color:"#2563eb",
  sizes:["small","medium","large","hyper"],
  short:"Protocol, gateway, versioning, rate limiting",
  detail:{
    what:"The API layer is the contract surface between your system and everything that consumes it: web/mobile clients, partner integrations, internal services. It covers the wire protocol (REST, GraphQL (Graph Query Language), gRPC (gRPC Remote Procedure Calls), WebSocket (persistent bidirectional communication protocol)), the gateway/edge layer that handles cross-cutting concerns (auth, rate limiting, SSL), versioning strategy, and the structure/style of the endpoints themselves.",
    why:"API decisions are uniquely sticky. Internal code can be refactored at will, but a public API has external consumers (mobile apps in the wild, partner integrations, third-party developers) who you can't force to upgrade. A v1 mistake might live for 5+ years. Getting the protocol, versioning, and contract style right at the start saves enormous pain later. Get it wrong and you'll either break consumers (losing trust) or maintain old API versions forever (paying complexity tax indefinitely).",
    numbers:"Plan for versioning from day 1, even if you only have v1. Breaking change policy: typically 6–12 month deprecation window for public APIs, longer for B2B. Latency budget: API gateway adds 1–5ms; account for it. Mobile app long tail: 20–30% of users on app versions >6 months old; design APIs assuming you can't push updates."
  },
  tradeoffs:[{axis:"Developer experience vs Performance",left:"GraphQL (Graph Query Language): flexible",right:"gRPC (gRPC Remote Procedure Calls): fast",pos:0.5},{axis:"Simplicity vs Flexibility",left:"REST: simple",right:"GraphQL (Graph Query Language): complex client queries",pos:0.5}],
  pitfalls:[
    {name:"No versioning strategy",desc:"You ship v1, then realize you need to change the response shape. Now you either break clients or invent versioning under pressure. Build /v1/ into the URL or Accept header on day 1."},
    {name:"Leaky abstractions in the API",desc:"API exposes your internal database column names. Now you can't refactor the DB without breaking the API. API should be a deliberate contract, not a thin wrapper over your tables."},
    {name:"Pagination as an afterthought",desc:"GET /users returns all users. Works fine at 100 users; melts down at 100K. Always paginate from day 1, even on small endpoints. Cursor-based pagination > offset (offset is broken on a moving dataset)."},
    {name:"No request idempotency",desc:"Mobile client retries a failed POST /charge. Server creates two charges. Always: support idempotency keys (Idempotency-Key header, dedup window of 24h)."},
    {name:"Errors with no machine-readable code",desc:"You return 'error: something went wrong' as text. Clients string-match on the message; you change wording → clients break. Always: structured error response with stable error_code field."}
  ],
  examples:[
    {name:"Stripe's API as gold standard",desc:"Versioned by date (?api_version=2024-06-20). Idempotency keys on every mutating endpoint. Predictable error codes. Backward compatibility maintained for years. Stripe routinely cited as the best-designed API in the industry — investment in API design pays compound interest."},
    {name:"Twitter API v1 → v2 transition",desc:"Twitter's v1 API became unmaintainable; v2 was a multi-year overhaul with breaking changes. Many third-party apps died in the transition. Demonstrates the cost of getting v1 wrong, and the difficulty of large-scale migration even with careful deprecation."}
  ],
  levelUp:[],
  children:[
    {name:"Protocol Selection",id:"api-proto",icon:"📡",phase:"API Layer",color:"#2563eb",
     sizes:["small","medium","large","hyper"],short:"REST vs GraphQL (Graph Query Language) vs gRPC (gRPC Remote Procedure Calls) vs WebSocket (persistent bidirectional communication protocol)",
     detail:{
       what:"The wire protocol and serialization format. REST: HTTP+JSON, simple, universal. GraphQL (Graph Query Language): HTTP+JSON with a query language; clients fetch exactly what they need in one trip. gRPC (gRPC Remote Procedure Calls): HTTP/2+Protobuf, binary, fast, code-generated clients. WebSocket (persistent bidirectional communication protocol): persistent bidirectional connection for push.",
       why:"Each is great at something different. REST: lowest barrier, ubiquitous tooling, fine for most external APIs. GraphQL (Graph Query Language): removes over-fetching/under-fetching when clients have varied needs (mobile vs web, etc.). gRPC (gRPC Remote Procedure Calls): 5–10× lower payload + lower CPU, ideal for service-to-service. WebSocket (persistent bidirectional communication protocol): required for real-time push (chat, live updates). Mixing them per use case (REST external, gRPC (gRPC Remote Procedure Calls) internal, WS for live) is normal.",
       numbers:"Latency comparison (typical): REST ~50–200ms total request, gRPC (gRPC Remote Procedure Calls) ~10–50ms (binary serialization saves ~5ms, HTTP/2 multiplexing saves another). Payload size: gRPC (gRPC Remote Procedure Calls)/Protobuf is ~5–10× smaller than equivalent JSON. GraphQL (Graph Query Language): 1 round trip vs N round trips for REST when client needs nested data. WebSocket (persistent bidirectional communication protocol): <5ms server-to-client push."
     },
     tradeoffs:[{axis:"Simplicity vs Efficiency",left:"REST: universal",right:"gRPC (gRPC Remote Procedure Calls): 5–10× smaller payload",pos:0.5},{axis:"Flexibility vs Performance",left:"GraphQL (Graph Query Language): arbitrary queries",right:"gRPC (gRPC Remote Procedure Calls): strict schema, fast",pos:0.5}],
     pitfalls:[
       {name:"GraphQL (Graph Query Language) N+1 query problem",desc:"GraphQL (Graph Query Language) resolver fetches each related item from the DB individually. 1 GraphQL (Graph Query Language) query → 100 DB queries. Use DataLoader pattern to batch."},
       {name:"GraphQL (Graph Query Language) exposed to public without query depth limits",desc:"Attacker sends a 50-level deep nested query → DB melts. Always: enforce max query depth, complexity, and per-client rate limits on GraphQL (Graph Query Language)."},
       {name:"gRPC (gRPC Remote Procedure Calls) for public mobile APIs",desc:"gRPC (gRPC Remote Procedure Calls) requires HTTP/2 + binary tooling. Many proxies/firewalls/CDNs don't handle it well. For public clients, stick with REST or GraphQL (Graph Query Language); reserve gRPC (gRPC Remote Procedure Calls) for internal."},
       {name:"WebSocket (persistent bidirectional communication protocol) without fallback",desc:"Some corporate proxies block WebSocket (persistent bidirectional communication protocol). Use a library like Socket.IO that falls back to long-polling, or document the requirement."}
     ],
     examples:[
       {name:"Facebook GraphQL (Graph Query Language) origin",desc:"Built GraphQL (Graph Query Language) because mobile clients needed varied subsets of profile data and round-tripping REST endpoints was killing perf on slow networks. Demonstrates the right problem for GraphQL (Graph Query Language): highly varied client needs over slow networks."},
       {name:"Google's gRPC (gRPC Remote Procedure Calls) everywhere internally",desc:"Google standardized on gRPC (gRPC Remote Procedure Calls) (and Stubby before that) for all internal RPC. Schema-first design via Protobuf gives them strict contracts and code generation across many languages."}
     ],
     sizes_cfg:{
       small:{range:"Public/mobile API",rec:"REST + JSON. Simple, universal tooling. OpenAPI/Swagger for docs. Start here always.",tools:["Express REST","FastAPI","Rails API","OpenAPI 3.0"]},
       medium:{range:"Mixed public + internal",rec:"REST for public APIs. Consider gRPC (gRPC Remote Procedure Calls) for internal service calls (2–10× better throughput). GraphQL (Graph Query Language) if clients need flexible queries.",tools:["gRPC (gRPC Remote Procedure Calls)","GraphQL (Graph Query Language) (Apollo)","REST","Postman"]},
       large:{range:"Internal service mesh",rec:"gRPC (gRPC Remote Procedure Calls) for all internal service-to-service calls. REST or GraphQL (Graph Query Language) for client-facing. WebSocket (persistent bidirectional communication protocol)s for real-time features. Schema registry for contracts.",tools:["gRPC (gRPC Remote Procedure Calls) + Protobuf","Buf (schema registry)","Apollo Federation","WebSocket (persistent bidirectional communication protocol)"]},
       hyper:{range:"Custom protocols for hot paths",rec:"gRPC (gRPC Remote Procedure Calls) everywhere internal. REST/GraphQL (Graph Query Language) for developers. Custom binary protocols for ultra-hot paths (game servers, trading). QUIC/HTTP3 at edge.",tools:["gRPC (gRPC Remote Procedure Calls)","QUIC","HTTP/3","custom binary","Flatbuffers"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Internal service calls >10K/day or payload size >1MB",action:"Add gRPC (gRPC Remote Procedure Calls) for internal. Keep REST external. Schema-first design."},
       {from:"medium",to:"large",trigger:">10 internal services or API latency >50ms internal",action:"Full gRPC (gRPC Remote Procedure Calls) internal. Service mesh for traffic management. Schema registry."},
       {from:"large",to:"hyper",trigger:"API latency SLO <5ms or throughput >1M RPS",action:"Custom binary protocols. HTTP/3. Stateful connections where beneficial."}
     ],
     children:[]},

    {name:"API Gateway",id:"api-gw",icon:"🚪",phase:"API Layer",color:"#2563eb",
     sizes:["small","medium","large","hyper"],short:"None → Nginx → managed → global custom",
     detail:{
       what:"A single point of entry for all incoming API traffic. Handles cross-cutting concerns so each service doesn't have to: authentication, rate limiting, SSL termination, request routing, logging, request/response transformation, API versioning, canary traffic splitting.",
       why:"Without a gateway, every service implements auth, rate limiting, SSL, etc. — duplicated work, inconsistent behavior, security gaps. With a gateway, these concerns are centralized: change auth in one place, applied everywhere. Gateway also enables platform features (canary deploys, A/B testing, request shadowing) that would be impossible to coordinate across many services individually.",
       numbers:"Latency added: 1–5ms typical for managed gateways, <1ms for tuned custom gateways. Throughput per gateway node: managed (Kong, AWS API Gateway) handle ~100K RPS; custom Envoy can do 1M+ RPS. Plan to deploy gateway in HA pairs at minimum."
     },
     tradeoffs:[{axis:"Centralization vs Latency",left:"One hop for auth etc.",right:"Added network latency",pos:0.5},{axis:"Managed vs Custom",left:"Less ops burden",right:"More control",pos:0.4}],
     pitfalls:[
       {name:"Business logic in the gateway",desc:"Gateway started as 'just routes and auth' — now has 5K lines of business logic. Becomes the bottleneck and a deployment risk for everything. Keep gateway thin: routing, auth, rate limit, logging. Business logic in services."},
       {name:"Gateway as single point of failure",desc:"Gateway down = entire API down. Always run multiple gateway instances behind a load balancer. Health-check them aggressively."},
       {name:"No bypass for internal traffic",desc:"Internal service calls go through the public gateway, paying full latency + auth overhead. Have a separate path for service-to-service (service mesh, internal DNS) that doesn't traverse the public gateway."}
     ],
     examples:[
       {name:"Netflix Zuul → custom gateway",desc:"Netflix originally built Zuul as their gateway, open-sourced it. Eventually moved to a custom gateway for finer control over traffic management at their scale. Demonstrates the typical evolution: managed → open-source → custom."},
       {name:"AWS API Gateway throttling at scale",desc:"AWS API Gateway has account-level throttling (10K RPS default per region). Many teams have been surprised by this during traffic spikes. Always check your gateway's own limits — it can become the bottleneck."}
     ],
     sizes_cfg:{
       small:{range:"Not needed yet",rec:"Use your web framework's built-in routing. SSL via Let's Encrypt on Nginx/Caddy. No separate gateway until you have >2 backend services.",tools:["Nginx","Caddy","Traefik"]},
       medium:{range:"2–20 backend services",rec:"Managed API gateway. Handles auth, rate limiting, SSL, routing. Avoid building custom at this stage.",tools:["AWS API Gateway","Kong","Nginx Plus","Azure API Management"]},
       large:{range:"20–500 services",rec:"High-performance gateway with config-as-code. Per-service routing rules. Traffic splitting for canary. WebSocket (persistent bidirectional communication protocol) support. Request/response transforms.",tools:["Kong","Envoy proxy","AWS API Gateway v2","Cloudflare Workers"]},
       hyper:{range:"500+ services, global traffic",rec:"Custom global gateway deployed at every PoP. Real-time config push (milliseconds). Per-edge rate limiting. BGP anycast. <1ms routing overhead.",tools:["Custom Envoy xDS","Cloudflare","Fastly Compute@Edge","custom Rust/C++"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:">2 backend services or need for centralized auth",action:"Deploy managed gateway. Move auth and rate limiting to gateway layer."},
       {from:"medium",to:"large",trigger:">20 services or traffic splitting needed",action:"Config-as-code gateway. Service discovery integration. Canary routing."},
       {from:"large",to:"hyper",trigger:"Gateway itself becoming bottleneck (>500K RPS) or global latency",action:"Custom gateway at edge PoPs. xDS-based config. Anycast routing."}
     ],
     children:[]},

    {name:"Rate Limiting",id:"api-rate",icon:"🚦",phase:"API Layer",color:"#2563eb",
     sizes:["small","medium","large","hyper"],short:"Per-user, per-IP, per-service rate control",
     detail:{
       what:"Limits on how many requests a client can make in a time window. Protects backend capacity from abuse, ensures fair usage among tenants, and protects you from your own clients (an infinite loop in a mobile app shouldn't crash production).",
       why:"Without rate limiting, one bad actor (or one buggy client) can take down your system. Even well-meaning clients can saturate you during deploys ('replay all queued requests now'). Rate limits also provide tier differentiation in monetized APIs (free=100/min, paid=10K/min). The cheapest insurance you can buy.",
       numbers:"Common tier shapes: free 100 req/min, basic 1K/min, enterprise 10K/min. Burst allowance: typically 2–5× sustained for short windows (token bucket). Per-IP limits as floor (anti-abuse): 1K/min/IP. Per-account limits for monetization. Algorithms: token bucket (good default), sliding window (more accurate, more memory), fixed window (simple, can spike at boundaries)."
     },
     tradeoffs:[{axis:"Strict vs Permissive limits",left:"Better protection",right:"Better developer experience",pos:0.5},{axis:"Accuracy vs Speed",left:"Exact count (Redis)",right:"Approximate (local counter)",pos:0.5}],
     pitfalls:[
       {name:"No 429 Retry-After header",desc:"Client gets 429 with no info on when to retry. They retry immediately, hammering you. Always include Retry-After: <seconds> header."},
       {name:"Rate limit on the wrong key",desc:"You rate-limit by IP. A million users behind one corporate NAT all hit the limit instantly. Limit by user ID / API key for authed traffic; IP only for anonymous endpoints."},
       {name:"Local-only limiting in distributed system",desc:"Each instance enforces its own limit. With 10 instances, the actual limit is 10× advertised. Use shared state (Redis) for accurate global limiting, or accept the multiplication."},
       {name:"No rate limit on auth/expensive endpoints",desc:"Login endpoint with no specific rate limit → credential stuffing attack. Always: tighter limits on auth, password reset, search, anything compute-heavy."}
     ],
     examples:[
       {name:"GitHub's tiered API rate limits",desc:"5K req/hr authenticated, 60/hr unauthenticated, 15K/hr for GitHub Apps. Different limits for the search API (more expensive). Demonstrates per-endpoint and per-tier limits as standard practice."},
       {name:"Cloudflare's edge rate limiting",desc:"Rate limiting enforced at the edge (POP) closest to user. Stops abuse before it hits your origin. At scale, edge-local limiting (with eventual global reconciliation) is the only way to keep latency low."}
     ],
     sizes_cfg:{
       small:{range:"Simple IP-based limiting",rec:"Use your framework middleware (rack-attack, express-rate-limit). Token bucket algorithm. Store counters in Redis or in-memory.",tools:["rack-attack","express-rate-limit","Flask-Limiter"]},
       medium:{range:"Per-user, per-API-key limiting",rec:"Gateway-level rate limiting. Sliding window algorithm. Per-endpoint limits (e.g., /send-email = 10/min, /list = 1000/min).",tools:["Kong rate-limit plugin","AWS API Gateway throttling","Redis cell"]},
       large:{range:"Distributed rate limiting across regions",rec:"Distributed Redis for shared counters. Token bucket with global state. Differentiated limits by tier. Retry-After headers. Rate limit analytics.",tools:["Redis Cluster","Envoy rate limit service","Lyft ratelimit"]},
       hyper:{range:"Per-edge rate limiting + global quota",rec:"Per-PoP local limiting (fast, no coordination). Global quota enforcement in background (eventual). GCRA algorithm. Shadow mode (log before enforce) for new limits.",tools:["Custom GCRA","edge-local counters","Envoy","custom control plane"]}
     },
     levelUp:[
       {from:"small",to:"medium",trigger:"Any abuse incident or API going public",action:"Per-user/key rate limiting. Tiered limits. Proper 429 responses with Retry-After."},
       {from:"medium",to:"large",trigger:"Rate limiting becoming throughput bottleneck or multi-region",action:"Distributed Redis counters. Async quota enforcement. Per-service limits."},
       {from:"large",to:"hyper",trigger:"Rate limit coordination adding latency or global quota needed",action:"Local approximate limiting + async global reconciliation."}
     ],
     children:[]}
  ]
};
