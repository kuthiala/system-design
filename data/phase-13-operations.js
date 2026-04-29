const PHASE_OPERATIONS = {
  name:"Phase 13 · Operations & DevOps",id:"ops",icon:"🚀",phase:"Operations",color:"#6b7280",
  sizes:["small","medium","large","hyper"],
  short:"Manual deploy → CI/CD → GitOps → platform engineering",
  detail:{
    what:"Operations is everything between 'code is written' and 'code is running for users': source control workflow, build pipelines, automated testing, deployment mechanics, infrastructure provisioning (IaC (Infrastructure as Code)), feature flags, incident response. Mature operations turn deployment from a scary event into a non-event you do 50 times a day.",
    why:"Deploy frequency is the strongest predictor of software quality (DORA (DevOps Research and Assessment) research). Counter-intuitively: teams that deploy many times a day have fewer outages than teams that deploy once a month. Why? Small changes are easier to debug. Frequent practice makes the deploy process battle-tested. Auto-rollback on errors works because errors are quickly noticed. Teams that deploy rarely accumulate risk into giant releases that explode on contact with reality.",
    numbers:"DORA (DevOps Research and Assessment) elite tier benchmarks: deploy frequency >1/day per service, change failure rate <15%, MTTR (Mean Time To Recovery) <1h, lead time <1h. Mid tier: deploy weekly, 16–30% failure, MTTR (Mean Time To Recovery) <1 day. Low tier: deploy monthly, 31–45% failure, MTTR (Mean Time To Recovery) >1 week. The gap between elite and low is roughly 200× in deploy frequency and similarly large in incident metrics."
  },
  tradeoffs:[
    {axis:"Deploy cadence",left:"Continuous deploy on green CI: minutes from merge to prod, 1% chance of incident per change",right:"Weekly batched releases with QA: safe, slow, giant diffs make rollback ambiguous"},
    {axis:"Pipeline gating",left:"Fully automated promotion: human-out-of-the-loop, fastest cycle time, hidden failures",right:"Manual approval gates per stage: clear accountability, breaks flow when reviewers sleep"}
  ],
  pitfalls:[
    {name:"Manual deployment steps",desc:"Anything in your deploy that requires a human ('SSH in and run this') will eventually be done wrong at 3am. Automate everything. If you can't automate, document brutally and rotate the runbook user."},
    {name:"No rollback plan",desc:"Deploy fails → take the site down for 2 hours while you fix forward. Always: every deploy must be reversible in <5 minutes. Database migrations: expand-contract so old code works with new schema. Code: keep last-known-good binary one click away."},
    {name:"Big-bang releases",desc:"Two months of changes shipped at once. When something breaks, you can't tell which of 200 changes caused it. Ship small. If a release has more than 1 day of changes, you've already lost."},
    {name:"Staging that doesn't match production",desc:"Staging is a single instance with a 100MB DB; production is 50 instances with 500GB. Bug only shows in prod. Staging must match prod's shape, even if scaled down (same services, same connectivity, anonymized prod-like data)."},
    {name:"Feature flags that never get cleaned up",desc:"3-year-old feature flag with 4 layers of conditional code, nobody remembers if it should be on. Set an expiration date on every flag. Code review catches expired flags."}
  ],
  examples:[
    {name:"Amazon's 'every 11.6 seconds'",desc:"In 2014 Amazon deployed code to production every 11.6 seconds on average across thousands of services. Not because they're reckless — because each deploy is tiny, automated, monitored, and reversible. Disproved the 'move fast = break things' false dichotomy."},
    {name:"Knight Capital 2012 ($440M in 30 minutes)",desc:"Failed deploy left old code running on 1 of 8 servers. Old code interpreted a new flag differently and started buying high / selling low. $440M loss in 30 minutes; company essentially ended. Lessons: deploy to all servers atomically; test config changes; monitor for anomalies (this would have been caught in 30s by basic monitoring)."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:">5 engineers or deploy conflicts",action:"CI/CD pipeline. Automated tests gate deploys. Staging environment."},
    {from:"medium",to:"large",trigger:">50 engineers or deploy frequency limited by process",action:"GitOps. Feature flags. Blue/green. Independent service deploys."},
    {from:"large",to:"hyper",trigger:">500 engineers or internal tooling is bottleneck",action:"Internal developer platform. Self-service infra. Platform engineering team."}
  ],
  sizes_cfg:{
    small:{range:"1–5 engineers",rec:"GitHub Actions CI/CD. Push to main = deploy. Single staging environment. Basic test suite. Deploy from CLI. Heroku/Railway/Render for zero-infra ops.",tools:["GitHub Actions","Heroku","Render","Railway","basic bash deploy"]},
    medium:{range:"5–50 engineers",rec:"CI/CD with test gates. Staging + production. Feature branches. Blue/green or rolling deploys. Database migrations automated. Rollback in <5 minutes.",tools:["GitHub Actions","CircleCI","ArgoCD","Spinnaker basic","feature flags via LaunchDarkly"]},
    large:{range:"50–500 engineers",rec:"GitOps (ArgoCD). Per-service deploy pipelines. Canary deploys (1%→5%→25%→100%). Feature flags for all user-facing changes. Automated rollback on error rate spike. Deploy frequency: multiple per service per day.",tools:["ArgoCD","Spinnaker","LaunchDarkly","Terraform","Atlantis for infra PR"]},
    hyper:{range:">500 engineers",rec:"Internal developer platform (Backstage). Self-service infra provisioning. Automated everything. Deploy velocity: 1000+ per day company-wide. Ownership enforcement (who owns this service?). Cost attribution per team.",tools:["Backstage","custom internal tooling","Terraform Enterprise","OPA for infra policy","custom deploy safety system"]}
  },
  children:[]
};
