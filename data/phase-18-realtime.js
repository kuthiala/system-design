const PHASE_REALTIME = {
  name:"Phase 18 · Real-time & Streaming",id:"realtime",icon:"⚡",phase:"Real-time",color:"#a855f7",
  sizes:["small","medium","large","hyper"],
  short:"Polling → WebSocket → SSE → custom protocols at edge",
  detail:{what:"Sub-second push of data from server to client (chat, notifications, presence, collaborative editing, live dashboards, gaming).",
    why:"HTTP polling is wasteful (95% of polls return nothing) and slow (poll interval is your latency floor). Real-time requires persistent connections and a different ops model.",
    numbers:"WebSocket connection: ~10–50KB memory per conn. 1M concurrent → 10–50GB RAM. CPU bound at ~100K conns/core. Connection storms on deploy: warm slowly with stickiness."},
  tradeoffs:[{axis:"Latency vs Cost",left:"WebSocket: persistent",right:"Polling: simple, wasteful",pos:0.7},{axis:"Push vs Pull",left:"Server push: complex",right:"Client poll: simple",pos:0.5}],
  levelUp:[
    {from:"small",to:"medium",trigger:"Polling interval <5s or chat/collab feature",action:"WebSocket or SSE. Single Node.js/Go server. Sticky sessions on LB."},
    {from:"medium",to:"large",trigger:">10K concurrent connections or fan-out >1K subscribers per topic",action:"Dedicated real-time tier. Pub/sub backplane (Redis Streams/NATS). Connection sharding. Presence service."},
    {from:"large",to:"hyper",trigger:">1M concurrent or sub-100ms global push",action:"Edge real-time (Cloudflare Durable Objects, Liveblocks-style). Custom WebSocket gateway. Geo-routed pub/sub. CRDT for conflict-free state."}
  ],
  children:[
    {name:"Transport",id:"rt-transport",icon:"📡",phase:"Real-time",color:"#a855f7",
     sizes:["small","medium","large","hyper"],short:"Long-poll → WebSocket → WebTransport / QUIC",
     detail:{what:"The wire-level mechanism for maintaining a low-latency channel between client and server.",
       why:"Each transport has different tradeoffs in firewall traversal, browser support, ordering, and HOL blocking.",
       numbers:"WebSocket: universal, TCP HOL-blocking. SSE: one-way, auto-reconnect built in. WebTransport (HTTP/3): UDP, no HOL, newer browser support. Long-polling: always works, expensive."},
     tradeoffs:[{axis:"Reliability vs Latency",left:"TCP: ordered",right:"UDP/WebTransport: low-jitter",pos:0.5}],
     sizes_cfg:{
       small:{range:"SSE for one-way, WS for two-way",rec:"Server-Sent Events for notifications/feeds (one-way). WebSocket if client must send. Falls back to long-polling automatically with Socket.IO.",tools:["Socket.IO","native WebSocket","SSE","Pusher (managed)"]},
       medium:{range:"Native WebSocket",rec:"Native WebSocket via Node.js (ws library) or Go (gorilla/websocket). Heartbeat every 30s. Reconnect with exponential backoff + jitter.",tools:["ws (node)","gorilla/websocket","Phoenix Channels (Elixir)","Ably (managed)"]},
       large:{range:"WebSocket with sharded gateway",rec:"WebSocket gateway tier separate from app. Connection sharded by user_id. Backplane (Redis pub/sub or NATS) for cross-shard fan-out.",tools:["Centrifugo","SocketCluster","Cloudflare Pub/Sub","NATS"]},
       hyper:{range:"WebTransport / custom QUIC",rec:"WebTransport (HTTP/3) for browsers (no HOL blocking). Custom QUIC for native apps. Edge termination. Multipath QUIC for mobile (handover seamlessly).",tools:["WebTransport","quic-go","msquic","Cloudflare Durable Objects"]}
     },
     levelUp:[],
     formulas:[
       {name:"Memory per connection",expr:"mem_per_conn ≈ socket_buffer (~8KB) + app_state (varies) + heartbeat (1KB)",note:"Realistic: 10–50KB. 1M conns ⇒ 10–50GB RAM, before app state."},
       {name:"Fan-out cost",expr:"messages_per_sec = publishes × avg_subscribers_per_topic",note:"Twitter celebrity problem: 100M followers × 1 tweet = 100M deliveries. Use pull-on-read for huge fan-outs."}
     ],
     pitfalls:[
       {name:"Sticky session leak",desc:"WebSocket requires sticky LB. On deploy, draining connections is slow (clients must reconnect). Plan rolling deploys with connection draining."},
       {name:"Thundering herd reconnect",desc:"After server restart, all clients reconnect simultaneously → connection storm. Use random jitter on reconnect delay (250ms–5s)."},
       {name:"Backpressure ignored",desc:"Slow client → outbound buffer grows → OOM. Implement per-connection buffer limits with disconnect on overflow."}
     ],
     related:[{id:"compute-lb",label:"Load Balancing"},{id:"msg-pattern",label:"Async Pattern"}],
     children:[]},

    {name:"Pub/Sub Backplane",id:"rt-pubsub",icon:"📢",phase:"Real-time",color:"#a855f7",
     sizes:["medium","large","hyper"],short:"Redis pub/sub → NATS → custom routing fabric",
     detail:{what:"The internal fabric that routes messages from a producer (e.g. message author) to all interested subscribers across many gateway nodes.",
       why:"With sharded gateways, the user receiving a message may be on a different node than the one the message was sent on. The backplane bridges them.",
       numbers:"Redis pub/sub: 100K msg/s, no persistence. NATS: 1M+ msg/s, JetStream for persistence. Kafka: durable but ~10–50ms added latency."},
     tradeoffs:[{axis:"Latency vs Durability",left:"Redis pub/sub: fast, lossy",right:"Kafka: durable, slower",pos:0.5}],
     sizes_cfg:{
       medium:{range:"Redis pub/sub",rec:"Single Redis with pub/sub. Topic = user_id or room_id. Fine up to ~100K msg/s.",tools:["Redis pub/sub","Redis Streams"]},
       large:{range:"NATS or Redis Streams",rec:"NATS for low-latency at-most-once. JetStream for at-least-once with replay. Subject hierarchy for fan-out routing.",tools:["NATS","NATS JetStream","Redis Streams","Centrifugo"]},
       hyper:{range:"Custom routing mesh",rec:"Custom mesh: subscribers register interest, messages routed via consistent hashing. Geo-aware: prefer local fan-out. Hybrid push (low-fanout) + pull (high-fanout celebrities).",tools:["Custom routing","Discord's Elixir cluster","Slack's flannel"]}
     },
     levelUp:[],
     examples:[
       {name:"Discord (Elixir)",desc:"Per-guild Erlang process holds state. Cross-node routing via Erlang distribution. 5M+ concurrent voice users."},
       {name:"Slack 'flannel'",desc:"Edge cache of channel metadata at every PoP — 1ms presence updates globally."}
     ],
     related:[{id:"msg-pattern",label:"Messaging"}],
     children:[]},

    {name:"Collaborative State",id:"rt-collab",icon:"👥",phase:"Real-time",color:"#a855f7",
     sizes:["medium","large","hyper"],short:"Last-write-wins → OT → CRDT",
     detail:{what:"Algorithms for merging concurrent edits to shared state (cursors, documents, drawings) without conflicts.",
       why:"Multiple users editing simultaneously create conflicts. The merge strategy determines correctness and UX.",
       numbers:"OT (Operational Transform): used by Google Docs, complex server logic. CRDT (Yjs/Automerge): no central server needed, larger metadata overhead (~10–30% per op)."},
     tradeoffs:[{axis:"OT vs CRDT",left:"OT: smaller, server-coordinated",right:"CRDT: P2P-capable, larger",pos:0.6}],
     sizes_cfg:{
       medium:{range:"Single-region OT or Yjs",rec:"Yjs for documents/drawings. ShareDB for OT. Server is authoritative; clients sync via WebSocket.",tools:["Yjs","Automerge","ShareDB","Liveblocks"]},
       large:{range:"Sharded with awareness service",rec:"Yjs with provider scaling: room-per-document, sharded by document ID. Awareness (cursors/presence) on separate channel — ephemeral, no persistence.",tools:["Yjs y-websocket","Hocuspocus","Liveblocks","custom OT server"]},
       hyper:{range:"Edge-based CRDT",rec:"CRDT state at edge (Durable Objects, Liveblocks-style). Geo-replicated with local-first writes. Background reconciliation across regions.",tools:["Cloudflare Durable Objects","Liveblocks Enterprise","custom CRDT + edge storage"]}
     },
     levelUp:[],
     pitfalls:[
       {name:"CRDT bloat",desc:"Naive CRDTs grow unboundedly with edits. Use garbage collection or compaction (Yjs has snapshot)."},
       {name:"Awareness leakage",desc:"Persisting cursor positions/typing indicators wastes storage and creates privacy issues. Keep in memory only."}
     ],
     examples:[
       {name:"Figma multiplayer",desc:"Custom CRDT in Rust for vector graphics. ~100 concurrent editors per file with sub-50ms latency."},
       {name:"Notion blocks",desc:"Hybrid: blocks have OT, properties use CRDT, comments are append-only."}
     ],
     related:[{id:"req-consist",label:"Consistency"}],
     children:[]}
  ]
};
