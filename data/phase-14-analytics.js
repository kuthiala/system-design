const PHASE_ANALYTICS = {
  name:"Phase 14 · Analytics & Data",id:"analytics",icon:"📊",phase:"Analytics",color:"#d97706",
  sizes:["small","medium","large","hyper"],
  short:"OLAP vs OLTP — separate analytical workloads",
  detail:{
    what:"Two fundamentally different workloads: OLTP (online transactional) — the requests your app makes, like 'fetch user 42 and update their cart' — single rows, indexed lookups, sub-millisecond. OLAP (online analytical) — the questions your business asks, like 'revenue by region by week for the last year' — full table scans across millions of rows. Analytics infrastructure (data warehouse, lake, BI tools) handles the OLAP side without touching the OLTP database.",
    why:"OLAP queries are silent killers when run against your transactional DB. A single 'SELECT SUM(amount) GROUP BY date' over 100M rows can saturate disk I/O for minutes — your users see latency spikes, your error rate climbs, all because the analyst clicked Refresh on a dashboard. Separation isn't optional past medium scale; it's table stakes. Column-oriented analytical stores (BigQuery, Snowflake, Redshift) also process those queries 10–100× faster than row stores by reading only the columns needed.",
    numbers:"Performance gap: an aggregation query on 100M rows takes ~30s on Postgres, ~1s on BigQuery — and BigQuery scales linearly to PB while Postgres falls over at TB. Cost gap: warehouse storage ~$20/TB/month, queries pay-per-scan. ETL latency: nightly batch (24h staleness) is fine for most BI; CDC (change data capture) gets you minutes of staleness; streaming (Kafka + Flink) gets sub-second. Pick the slowest acceptable — each step up costs significantly more."
  },
  tradeoffs:[{axis:"OLAP vs OLTP",left:"Analytics: column store",right:"Transactional: row store",pos:0.5},{axis:"Realtime vs Batch",left:"Streaming analytics",right:"Batch ETL: simpler",pos:0.5}],
  pitfalls:[
    {name:"Running BI queries against the production DB",desc:"Easy and free at first. Then a finance dashboard with 5 nested CTEs runs every 15 minutes and your p99 latency doubles. Always: separate analytical from transactional storage past 1M rows or any complex aggregation."},
    {name:"ETL that breaks silently",desc:"Nightly export job fails for 3 days; nobody notices because the dashboards still show data (just stale). Always: data freshness monitoring + alert if last-updated-at is older than expected. Treat data pipelines like production services."},
    {name:"Schema drift between OLTP and warehouse",desc:"Add a column in production → warehouse export breaks → analytics gone. Use schema-aware CDC (Debezium) and contract tests on the export."},
    {name:"PII in the warehouse",desc:"Production has GDPR controls; the warehouse copy of the same data doesn't. User does deletion request — you delete from prod but forget the warehouse. Apply same controls; sync deletes."},
    {name:"Complex business logic in dbt models with no tests",desc:"Revenue calculation in dbt has a subtle bug. Six months of board reports are wrong. Add data tests (Great Expectations / dbt tests) — assert column nullness, uniqueness, value ranges, row count drift."}
  ],
  examples:[
    {name:"Airbnb's data warehouse evolution",desc:"Started with MySQL replicas → moved to Hadoop → now on Spark/Presto + S3. Each transition driven by hitting a wall on the previous one. Demonstrates that analytics architecture evolves with data volume, just like OLTP."},
    {name:"Stitch Fix's data-driven everything",desc:"Built recommendation engine on top of warehouse + ML. Data infrastructure investment is what made personalization possible. Demonstrates that analytics isn't a cost center — it's the input to the most valuable features."}
  ],
  levelUp:[
    {from:"small",to:"medium",trigger:"Any complex analytical query taking >1s",action:"Separate read replica for analytics. Or export to BigQuery/Redshift."},
    {from:"medium",to:"large",trigger:">10M rows in analytical tables or BI team forming",action:"Dedicated data warehouse. ETL pipeline. Separate OLAP store."},
    {from:"large",to:"hyper",trigger:"Data team >50 people or real-time analytics needed",action:"Data lake + lakehouse. Streaming analytics. Data mesh."}
  ],
  sizes_cfg:{
    small:{range:"Direct Postgres queries or simple exports",rec:"Run analytics queries on read replica off-peak. Export to Google Sheets/Metabase for BI. Simple enough at this scale.",tools:["Metabase","Postgres read replica","Redash","Google Sheets"]},
    medium:{range:"Dedicated analytics DB",rec:"Export to BigQuery or Redshift nightly. BI tool on top. Separate from production DB entirely. Avoid ETL complexity: CDC (change data capture) with Debezium.",tools:["BigQuery","Redshift","Snowflake","Debezium CDC","dbt","Metabase"]},
    large:{range:"Data warehouse + ETL pipelines",rec:"Data warehouse (Snowflake/BigQuery). CDC + Kafka for near-realtime. dbt for transformations. Data catalog (Amundsen). Data quality monitoring.",tools:["Snowflake","BigQuery","Apache Spark","dbt","Airflow","Kafka","Great Expectations"]},
    hyper:{range:"Data lake + streaming analytics + data mesh",rec:"Data lake (S3 + Parquet). Lakehouse (Delta Lake/Iceberg). Stream processing (Flink) for real-time. Data mesh: domain ownership. Petabyte-scale querying.",tools:["Apache Iceberg","Delta Lake","Apache Flink","Spark","Databricks","custom data platform"]}
  },
  children:[]
};
