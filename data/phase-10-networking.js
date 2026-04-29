const PHASE_NETWORKING = {
  name:"Phase 10 · Networking & CDN",id:"network",icon:"🌐",phase:"Networking",color:"#0891b2",
  sizes:["small","medium","large","hyper"],
  short:"Simple DNS → ALB → service mesh → anycast + PoPs (Points of Presence)",
  detail:{
    what:"The networking layer is everything that moves bytes between users and your servers, and between your services. DNS (turning a name into an IP), TLS (encrypting in transit), CDN (caching content close to users), service mesh (encrypting and observing internal traffic), and the underlying transports (HTTP/1.1 (HyperText Transfer Protocol version 1.1), HTTP/2 (HyperText Transfer Protocol version 2), HTTP/3 (HyperText Transfer Protocol version 3)/QUIC (Quick UDP Internet Connections)). It's the substrate every other component sits on.",
    why:"Network is the last mile of latency, and the first mile of unreliability. A perfectly tuned backend served from us-east-1 still adds 150ms for a user in Singapore — no application code change can help. CDN closes that gap by caching at POPs near users. Service mesh makes internal calls observable and secure without per-service work. HTTP/3 (HyperText Transfer Protocol version 3) reclaims latency on flaky mobile networks. Underinvest here and your fast app feels slow; overinvest and you maintain infrastructure you don't need.",
    numbers:"Speed of light in fiber: ~5ms per 1000km, with ~2× for routing/queueing in practice. NYC↔London: ~70ms RTT minimum. CDN cache hit latency: 5–30ms from any user globally. HTTP/2 (HyperText Transfer Protocol version 2) saves ~1 RTT vs HTTP/1.1 (HyperText Transfer Protocol version 1.1) (multiplexing). HTTP/3 (HyperText Transfer Protocol version 3) (QUIC (Quick UDP Internet Connections) over UDP) saves another RTT on connection setup and eliminates TCP head-of-line blocking — major win on mobile (10–30% faster page loads)."
  },
  tradeoffs:[
    {axis:"Edge routing strategy",left:"Single global endpoint behind GeoDNS: simple ops, latency varies 100–300ms by user location",right:"Anycast IPs across regions: lowest latency per user, BGP peering and capacity tuning required"},
    {axis:"Point of Presence (PoP) coverage",left:"5–10 PoPs: cheaper to peer and manage, far users see 100–300ms",right:"100+ PoPs: <30ms latency anywhere, expensive per-network peering and operations"}
  ],
  pitfalls:[
    {name:"No CDN for static assets",desc:"Your JS bundle (500KB) downloaded from us-east-1 is 500ms to a user in India. Same bundle from a CDN POP in Mumbai is 30ms. CDN for static assets is universally correct — there's no reason not to."},
    {name:"TLS termination only at LB, then plaintext internally",desc:"Traffic is encrypted to the LB, then plaintext between services. An attacker inside your VPC can sniff everything. Use mTLS (mutual Transport Layer Security) via service mesh — encrypt the entire request path."},
    {name:"DNS as a load balancer",desc:"Round-robin DNS for failover. ISPs and clients cache DNS aggressively (often ignoring TTL). Real failover takes 5–15 minutes. Use anycast or health-aware LB instead."},
    {name:"Forgetting connection limits",desc:"Each service-to-service call opens a new TCP connection (no pooling). At 10K RPS, you've exhausted ephemeral ports. Use HTTP/2 (HyperText Transfer Protocol version 2) or gRPC with connection reuse."},
    {name:"BGP not your friend if self-managing",desc:"Anycast/BGP routing is cheap to claim, expensive to operate. Misconfiguration causes Internet-wide outages (Facebook 2021). Use Cloudflare/Fastly until you have a network team."}
  ],
  examples:[
    {name:"Cloudflare's 300+ POPs",desc:"Their network reaches >95% of internet users in <50ms. Smaller players using a single CDN POP can't match this. Geographic distribution of POPs is competitive moat."},
    {name:"Facebook 2021 BGP outage",desc:"A misconfigured BGP route announcement made Facebook completely unreachable for 6 hours. Even employees couldn't badge into buildings (which depended on Facebook's DNS). Networking is invisible until it's catastrophically broken."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Users in >1 geography or static assets >1MB",action:"CDN for static assets. Move to HTTPS/2."},
    {from:"medium",to:"large",trigger:">20% traffic from outside home region",action:"Multi-region. GeoDNS. Edge workers."},
    {from:"large",to:"hyper",trigger:"Latency SLO <50ms globally",action:"Anycast. PoP network. Per-edge compute."}
  ],
  sizes_cfg:{
    small:{range:"Single region, simple DNS",rec:"Domain → Cloudflare (free CDN+DDoS). Static assets on CDN. HTTPS via Let's Encrypt. HTTP/2 (HyperText Transfer Protocol version 2) on your LB.",tools:["Cloudflare free","Let's Encrypt","AWS Route53","nginx"]},
    medium:{range:"CDN + GeoDNS",rec:"CloudFront or Cloudflare Pro for dynamic caching. Edge workers for A/B testing and personalization headers. HTTP/2 (HyperText Transfer Protocol version 2) everywhere. TCP BBR congestion control.",tools:["CloudFront","Cloudflare Workers","AWS Global Accelerator","GeoDNS"]},
    large:{range:"Multi-region + service mesh",rec:"Service mesh (Istio) for service-to-service mTLS (mutual Transport Layer Security), observability, traffic management. Global LB with latency-based routing. HTTP/3 (HyperText Transfer Protocol version 3) + QUIC (Quick UDP Internet Connections) for mobile clients.",tools:["Istio","Linkerd","AWS Global Accelerator","Cloudflare","QUIC (Quick UDP Internet Connections)/HTTP3"]},
    hyper:{range:"Anycast + custom PoP network",rec:"Anycast IP with BGP. 200+ PoPs (Points of Presence) globally. Sub-10ms first-byte time from any user. Custom CDN optimized for your content type. QUIC (Quick UDP Internet Connections) internally between PoPs (Points of Presence).",tools:["Custom BGP anycast","Fastly","Cloudflare Enterprise","custom QUIC (Quick UDP Internet Connections)","dedicated fiber"]}
  },
  children:[]
};
