const PHASE_SECURITY = {
  name:"Phase 12 · Security & Auth",id:"security",icon:"🔐",phase:"Security",color:"#7c3aed",
  sizes:["small","medium","large","hyper"],
  short:"Basic auth → OAuth2 → zero-trust → custom identity",
  detail:{
    what:"Three intertwined concerns: authentication (proving who you are — passwords, tokens, hardware keys), authorization (deciding what you're allowed to do — RBAC, ABAC (Attribute-Based Access Control), policy engines), and data protection (encryption at rest, in transit, key management, secrets handling). Plus the operational side: secure development lifecycle, vulnerability scanning, incident response.",
    why:"Security failures are existential, not just expensive. A breach doesn't just cost money (avg cost ~$4.5M per IBM 2023) — it costs trust, customers, and sometimes the company. The cheapest time to add security is the first day; it's exponentially more expensive to retrofit. The good news: 90% of breaches come from the same handful of mistakes (weak auth, unpatched systems, leaked secrets, misconfigured cloud). Cover those well and you're ahead of most companies your size.",
    numbers:"Password hashing: bcrypt cost factor ≥12 (~300ms/hash) makes brute force infeasible. Token expiry: access tokens 15min, refresh tokens 7–30 days, hardware-backed sessions for sensitive ops. Auth endpoint rate limit: 5 attempts/min/IP. TLS: nothing below TLS 1.2; prefer 1.3. Secrets rotation: 90 days for API keys, 1 year for service accounts, immediately on suspected exposure. MFA reduces account takeover by ~99% (Microsoft data)."
  },
  tradeoffs:[{axis:"Security vs UX",left:"Strict: more friction",right:"Permissive: better UX",pos:0.5},{axis:"Custom vs Standard",left:"Custom: full control",right:"Standards: fewer bugs",pos:0.5}],
  pitfalls:[
    {name:"Rolling your own crypto/auth",desc:"You think you can implement OAuth2 / JWT / password storage 'simply.' You will get it wrong in subtle ways (timing attacks, token confusion, session fixation). Use Auth0, Clerk, Cognito, or a battle-tested library. Crypto/auth is one of the few areas to never DIY."},
    {name:"Secrets in environment variables, then in git",desc:"You start with .env files. Someone commits one to a public repo. Now your AWS keys are on GitHub for 12 minutes before bots find them, then $40K of crypto mining hits your bill. Use a secrets manager (Vault, AWS Secrets Manager, Doppler) from day 1."},
    {name:"Trusting the network perimeter",desc:"You assume 'inside our VPC = safe.' One compromised service = full lateral movement. Zero-trust: every service authenticates every request, even internal. Use mTLS and per-request authorization."},
    {name:"Logs containing PII / credentials",desc:"req.body logged on errors → passwords, credit cards, API keys end up in CloudWatch / Splunk / dev laptops. Scrub at the logger; never log the full request body."},
    {name:"No rate limiting on auth/expensive endpoints",desc:"Login endpoint with no rate limit = credential stuffing in minutes. Password reset with no rate limit = email bomb users. Always rate limit auth, password reset, search, and any endpoint that's expensive."}
  ],
  examples:[
    {name:"Equifax breach (2017)",desc:"147M people's data leaked because Apache Struts had an unpatched CVE (Common Vulnerabilities and Exposures) for 2 months. Lesson: vulnerability management is security 101. Automated dependency scanning (Dependabot, Snyk) is non-negotiable."},
    {name:"Google's BeyondCorp",desc:"Pioneered zero-trust at scale: no VPN (Virtual Private Network), every request authenticated and authorized regardless of source. Now industry-standard pattern. Demonstrates that perimeter security doesn't scale."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Any third-party integrations or API keys",action:"OAuth2. JWT. API key management. Audit log."},
    {from:"medium",to:"large",trigger:">100 internal services or SOC2 compliance",action:"Zero-trust network. mTLS between services. RBAC. Secrets manager."},
    {from:"large",to:"hyper",trigger:"Nation-state threat model or billions of users",action:"Custom identity platform. Hardware security keys. Continuous auth. Advanced threat detection."}
  ],
  sizes_cfg:{
    small:{range:"Session auth or JWT",rec:"bcrypt password hashing. HTTPS everywhere. Rate limit login. Session-based or JWT auth. Basic RBAC (admin/user). OWASP (Open Web Application Security Project) top 10 review before launch.",tools:["Devise (Rails)","Passport.js","Auth0 free tier","bcrypt","Let's Encrypt"]},
    medium:{range:"OAuth2 + JWT + API keys",rec:"OAuth2 social login. JWT with refresh tokens. API key management for integrations. Role-based access control. Secrets in environment variables → move to Vault.",tools:["Auth0","Clerk","Firebase Auth","Okta","HashiCorp Vault"]},
    large:{range:"Zero-trust + mTLS + RBAC",rec:"Zero-trust: assume breach inside network. mTLS between all services (service mesh). Centralized RBAC with policy as code. Secrets manager. SOC2/ISO27001. SIEM (Security Information and Event Management) for audit.",tools:["Istio mTLS","OPA (Open Policy Agent)","HashiCorp Vault","Okta","Splunk SIEM (Security Information and Event Management)","AWS GuardDuty"]},
    hyper:{range:"Custom identity platform + hardware keys",rec:"Custom identity platform with billions of users. FIDO2/WebAuthn hardware key support. Continuous authentication (behavior analysis). ML-based threat detection. Dedicated security team.",tools:["Custom OAuth server","FIDO2/WebAuthn","custom ML threat detection","Hardware HSM","Google BeyondCorp"]}
  },
  children:[]
};
