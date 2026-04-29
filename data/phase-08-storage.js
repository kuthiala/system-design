const PHASE_STORAGE = {
  name:"Phase 8 · File & Blob Storage",id:"storage",icon:"📁",phase:"Storage",color:"#0891b2",
  sizes:["small","medium","large","hyper"],
  short:"Local disk → object storage → CDN → multi-region edge",
  detail:{
    what:"Storage for unstructured binary data: user uploads (images, videos, PDFs), generated files (reports, exports), backups, logs. Object storage (S3, GCS, R2) is the canonical answer — flat key-value namespace, virtually infinite capacity, designed for HTTP access, durable to 11 nines.",
    why:"Binary data doesn't belong in your database. A 5MB image stored as a Postgres BLOB bloats the table, kills cache effectiveness, slows backups by 10×, and costs ~10× more per GB than S3. Object storage solves this: cheap, infinite, designed for the access pattern. Adding a CDN in front then makes those files fast globally — the CDN serves the 95% of requests for popular files from edge POPs at <10ms, while origin (S3) handles only the long tail.",
    numbers:"S3 cost: ~$0.023/GB/month standard; $0.004/GB/month for Glacier Deep Archive. Database storage: $0.10–0.20/GB/month. CDN cache hit ratio target: >90%; reduces origin load by that factor. S3 durability: 11 nines (99.999999999%) — designed to lose <1 object per 10K objects per 10M years. Pre-signed URLs (client uploads directly to S3) eliminate proxying through your servers — saves bandwidth and latency."
  },
  tradeoffs:[
    {axis:"Origin vs edge serving",left:"Serve from origin S3 only: cheapest egress, 100–300ms for distant users",right:"CDN at every PoP: $$$ per GB cached, 5–30ms latency globally"},
    {axis:"Replication scope",left:"Replicated across regions: 11 nines durability, ~2× storage cost, survives region loss",right:"Single region: cheaper, region-wide outage = data unavailable until restore"}
  ],
  pitfalls:[
    {name:"Proxying file uploads through your app",desc:"User uploads 100MB video → your app receives it → forwards to S3. You pay for double bandwidth and your app servers' RAM/CPU. Use S3 pre-signed POST URLs so client uploads directly to S3."},
    {name:"Public S3 bucket leaks",desc:"The most common cloud security incident: a bucket accidentally made public, leaks customer data. Default to private; use CloudFront/CDN with signed URLs for public-ish access. Enable AWS Block Public Access at account level."},
    {name:"No lifecycle policy",desc:"User uploads logs from 2018 still in S3 Standard at full price. Set lifecycle rules: 90 days → Infrequent Access, 1 year → Glacier, 7 years → delete (or compliance retention)."},
    {name:"Forgetting CDN cache invalidation",desc:"You replace user-avatar.jpg but CDN serves old version for hours. Either: include hash in URL (avatar-abc123.jpg, immutable) or call CDN purge API on update."},
    {name:"Client-side CDN URL hardcoded",desc:"You ship a mobile app with hardcoded https://d123.cloudfront.net/.... Now you can't switch CDNs without an app update. Always use your own domain (cdn.example.com) with a CNAME."}
  ],
  examples:[
    {name:"Instagram photo storage at scale",desc:"Originally on S3, but at billions of photos with constant resizing for many device sizes, they built Haystack — Facebook's purpose-built photo store with much lower per-object overhead than S3. Demonstrates that even S3 has limits at extreme scale."},
    {name:"Imgur on a CDN-heavy architecture",desc:"99%+ of traffic served by CDN; origin S3 is essentially write-only + occasional misses. Their bandwidth bill would 100× without aggressive CDN caching."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Any user-uploaded file or file >1MB",action:"Migrate to S3/GCS immediately. Never store binary in DB."},
    {from:"medium",to:"large",trigger:">100GB stored or users globally distributed",action:"CDN in front of object storage. Pre-signed URLs for uploads. Image optimization pipeline."},
    {from:"large",to:"hyper",trigger:"CDN cache miss rate >10% or edge latency SLO",action:"Multi-CDN. Edge storage. Smart routing. Image serving at edge."}
  ],
  sizes_cfg:{
    small:{range:"<10GB, few file types",rec:"S3 or GCS from day 1. Never store files in Postgres. Use pre-signed URLs for client uploads directly to S3.",tools:["AWS S3","GCP GCS","Cloudflare R2","Backblaze B2"]},
    medium:{range:"10GB–10TB",rec:"S3 + CloudFront CDN for static assets. Image resizing on upload (Lambda). 90-day lifecycle to Glacier for old files. Signed URLs expire in 1h.",tools:["S3 + CloudFront","Imgix or Cloudinary","AWS Lambda for transforms","S3 Intelligent Tiering"]},
    large:{range:"10TB–1PB",rec:"Multi-CDN (primary + fallback). Image optimization at CDN edge. Video: adaptive bitrate streaming (HLS). Content at edge PoPs. Replication to secondary region.",tools:["Cloudflare + CloudFront multi-CDN","Fastly Image Optimizer","AWS MediaConvert","S3 Cross-Region Replication"]},
    hyper:{range:">1PB",rec:"Distributed object storage across all regions. Content-aware CDN routing. On-device caching for mobile. Petabyte-scale erasure coding. Custom storage formats for efficiency.",tools:["Custom distributed storage","Google Colossus-inspired","Facebook Haystack/f4 pattern","erasure coding"]}
  },
  children:[]
};
