const PHASE_COMPLIANCE = {
  name:"Phase 19 · Compliance & Governance",id:"compliance",icon:"⚖️",phase:"Compliance",color:"#84cc16",
  sizes:["small","medium","large","hyper"],
  short:"GDPR · SOC2 · HIPAA · data residency · right-to-erasure",
  detail:{what:"Architectural patterns for satisfying data protection regulations (GDPR, CCPA, HIPAA, PCI-DSS) and security standards (SOC2, ISO 27001).",
    why:"Compliance is architectural, not bolted-on. Right-to-erasure across 100 services and 5 backups is a year-long project if not designed in. GDPR fines: up to 4% of global revenue.",
    numbers:"GDPR: 30 days to fulfill DSR (data subject request). HIPAA: 7-year audit log retention. PCI-DSS: cardholder data must be encrypted at rest and in transit, with annual audit."},
  tradeoffs:[{axis:"Compliance overhead vs Velocity",left:"Strict: slow features",right:"Lax: regulatory risk",pos:0.5},{axis:"Centralized PII vs Distributed",left:"PII vault: easier audit",right:"Inline PII: simpler code",pos:0.4}],
  levelUp:[
    {from:"small",to:"medium",trigger:"First EU/CA user or first enterprise contract",action:"PII inventory. DSR fulfillment process. Privacy policy. SOC2 Type 1."},
    {from:"medium",to:"large",trigger:"SOC2 Type 2 / HIPAA / regulated industry",action:"PII vault (tokenization). Audit log infra. Data residency controls. DPA template."},
    {from:"large",to:"hyper",trigger:"Operating in 20+ jurisdictions or government contracts",action:"Per-region data planes. Sovereign cloud (FedRAMP/IL5). Continuous compliance automation."}
  ],
  children:[
    {name:"PII Handling",id:"comp-pii",icon:"🆔",phase:"Compliance",color:"#84cc16",
     sizes:["small","medium","large","hyper"],short:"Inline → tokenized → centralized vault",
     detail:{what:"Strategies for storing, accessing, and deleting personally identifiable information (PII) across your system.",
       why:"PII scattered across 50 microservices, 10 data warehouses, and 5 years of backups makes deletion impossible. Centralize early.",
       numbers:"Tokenization: replaces PII with opaque token. Original kept in vault with strict ACL. Logs/analytics use tokens — no PII leak via logs."},
     tradeoffs:[{axis:"Vault vs Inline",left:"Vault: 1 hop, easy delete",right:"Inline: 0 hops, delete is hard",pos:0.4}],
     sizes_cfg:{
       small:{range:"Inline PII with delete-on-request",rec:"Mark PII columns clearly. Single delete query path. Don't put PII in logs (use IDs only). Encrypt at rest (RDS/managed DB default).",tools:["Postgres column comments","sentry data scrubber","Logger redaction"]},
       medium:{range:"Tokenization for sensitive fields",rec:"Tokenize SSN, credit card, full name. Token in app DB, raw in vault. Field-level encryption for medium-sensitive (DOB, address).",tools:["Vault Transit","Skyflow","AWS KMS field encryption","HashiCorp Vault"]},
       large:{range:"Centralized PII vault + DSR pipeline",rec:"All PII in vault. Apps work with tokens. Async DSR pipeline traces token across systems and deletes/exports. Quarterly access audit.",tools:["Skyflow","Privacera","custom vault","Transcend (DSR automation)"]},
       hyper:{range:"Per-jurisdiction data planes",rec:"PII never leaves jurisdiction of residence. Cross-region only sees tokens. Sovereign clouds for regulated geographies.",tools:["Per-region vaults","AWS GovCloud","Azure China","custom data plane"]}
     },
     levelUp:[],
     pitfalls:[
       {name:"PII in logs/traces",desc:"The #1 leak vector. Logs replicated to dozens of places (Splunk, S3, dev laptops). Scrub at source."},
       {name:"Backups outlive deletion",desc:"You delete user data but it lives in backups for 7 years. Either: encrypt backups with per-user keys (delete key = crypto-shred) or accept retention exception."},
       {name:"Forgotten replicas",desc:"Read replica in dev environment with prod data snapshot from 2 years ago. Inventory all data copies."}
     ],
     examples:[
       {name:"Stripe Vault",desc:"Card data never touches merchant servers. Token-based with PCI scope minimization."},
       {name:"Apple Differential Privacy",desc:"Adds noise to aggregated data so individual users can't be re-identified, even by Apple."}
     ],
     related:[{id:"security",label:"Security"},{id:"req-geo",label:"Geography"}],
     children:[]},

    {name:"Audit Logging",id:"comp-audit",icon:"📜",phase:"Compliance",color:"#84cc16",
     sizes:["medium","large","hyper"],short:"Append-only · tamper-evident · long retention",
     detail:{what:"An immutable, append-only log of all access and changes to sensitive data, retained per regulatory requirements.",
       why:"Required by SOC2, HIPAA, PCI-DSS, SOX. Also essential for incident forensics and insider threat detection.",
       numbers:"Retention: SOC2 = 1y, HIPAA = 6y, PCI = 1y hot + total 1y, SOX = 7y. Audit logs: 5–20% of total log volume but 100% of legal importance."},
     tradeoffs:[{axis:"Tamper-evidence vs Cost",left:"Hash chain: provable",right:"Plain log: cheap",pos:0.5}],
     sizes_cfg:{
       medium:{range:"Structured audit log to separate sink",rec:"Emit audit event on every PII access, role change, data export. Separate stream from app logs. Dedicated S3 bucket with object lock.",tools:["AWS CloudTrail","S3 Object Lock","structured log (JSON)","AuditBeat"]},
       large:{range:"Append-only with hash chain",rec:"Hash chain (each entry hashes previous) for tamper evidence. WORM storage. Quarterly external audit access. SIEM integration.",tools:["AWS QLDB","Immudb","Splunk","Elastic SIEM","Datadog Cloud SIEM"]},
       hyper:{range:"Immutable ledger + real-time anomaly detection",rec:"Distributed ledger (cryptographically signed). Real-time ML anomaly detection on access patterns. Automated insider-threat alerts.",tools:["Custom ledger","ML-based UEBA","Chronicle Security","Datadog CloudSIEM"]}
     },
     levelUp:[],
     related:[{id:"obs",label:"Observability"}],
     children:[]}
  ]
};
