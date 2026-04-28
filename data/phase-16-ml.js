const PHASE_ML = {
  name:"Phase 16 · ML & AI Workloads",id:"ml",icon:"🧠",phase:"ML/AI",color:"#ec4899",
  sizes:["small","medium","large","hyper"],
  short:"Inference serving · vector DBs · LLM gateways · training infra",
  detail:{what:"Architecture for machine learning inference (real-time predictions), batch scoring, embedding/vector retrieval, and model training pipelines. Increasingly co-equal with the transactional stack.",
    why:"ML workloads have radically different cost, latency, and scaling characteristics than CRUD. A GPU is 50–500× more expensive per hour than a CPU. Throwing ML on regular infra wastes money or breaks SLOs.",
    numbers:"GPU inference: A100 ~$2–4/hr cloud, T4 ~$0.35/hr. LLM token cost: GPT-4 ~$30/1M input tokens, open-source ~$0.20/1M (self-hosted). Embedding cost: ~$0.02/1M tokens. Vector search: 10–50ms p99 at 100M vectors."},
  tradeoffs:[{axis:"Latency vs Cost",left:"Realtime GPU: $$$",right:"Batch CPU: $",pos:0.5},{axis:"Hosted API vs Self-host",left:"OpenAI/Anthropic: simple",right:"vLLM/TGI: control + cheap at scale",pos:0.5},{axis:"Accuracy vs Speed",left:"Big model: slow, accurate",right:"Distilled/quantized: fast",pos:0.5}],
  levelUp:[
    {from:"small",to:"medium",trigger:"LLM API spend >$2K/mo or latency-sensitive use case",action:"Add prompt caching, response caching (semantic). Move embeddings to dedicated vector DB. Batch where possible."},
    {from:"medium",to:"large",trigger:"LLM spend >$50K/mo or RAG corpus >10M docs",action:"Self-host open-source models (vLLM/TGI). Dedicated GPU pool. Vector DB cluster (Qdrant/Pinecone). Model gateway with fallback chain."},
    {from:"large",to:"hyper",trigger:"Inference >100K QPS or training own foundation models",action:"Custom inference stack. Model distillation pipeline. Speculative decoding. Multi-GPU sharding (tensor + pipeline parallel). Dedicated training cluster."}
  ],
  children:[
    {name:"Model Serving",id:"ml-serve",icon:"🤖",phase:"ML/AI",color:"#ec4899",
     sizes:["small","medium","large","hyper"],short:"Hosted API → vLLM → custom serving stack",
     detail:{what:"The infrastructure that takes a trained model and serves predictions at production latency and reliability.",
       why:"Model serving has unique problems: cold start (loading multi-GB weights), batching (GPUs are wasted at batch size 1), tail latency from variable token counts, and request shape diversity.",
       numbers:"Triton/vLLM: 5–20× higher GPU utilization than naive Flask. Continuous batching: 3–10× throughput vs static batching. KV cache: 50%+ of GPU memory for LLMs."},
     tradeoffs:[{axis:"Throughput vs p99 latency",left:"Big batches: high TPS",right:"Small batches: low latency",pos:0.5}],
     sizes_cfg:{
       small:{range:"OpenAI/Anthropic API only",rec:"Use hosted APIs. Add a thin gateway layer in your code (model_client.complete()) so you can swap providers later. Cache aggressively (input hash → output).",tools:["OpenAI API","Anthropic","LiteLLM (multi-provider)","langchain"]},
       medium:{range:"Mix hosted + 1–2 self-hosted models",rec:"Self-host smaller models (7B–13B) on a single A100/H100 with vLLM or TGI. Reserve hosted APIs for hardest queries. Build a router (cheap model first, escalate on low confidence).",tools:["vLLM","TGI (HuggingFace)","Ollama","Modal","Replicate"]},
       large:{range:"Dedicated inference fleet",rec:"Multi-tenant inference cluster. Continuous batching. Speculative decoding for 2–3× speedup. Model registry. A/B test models. Quantization (INT8/FP8) for 2–4× throughput.",tools:["vLLM","TensorRT-LLM","Triton Inference Server","Ray Serve","KServe"]},
       hyper:{range:"Custom serving stack at edge",rec:"Custom kernels (FlashAttention etc). Tensor + pipeline parallelism for >70B models. Disaggregated prefill/decode (separate clusters). Edge inference for latency-critical (<10ms). FP8/INT4 quantization standard.",tools:["Custom CUDA","FlashAttention-3","Megatron-LM","DeepSpeed","custom CUDA graphs"]}
     },
     levelUp:[],
     formulas:[
       {name:"GPU memory for LLM",expr:"vram_gb = (params_billions × bytes_per_param) + (kv_cache_per_token × max_seq_len × batch_size × layers × 2)",note:"7B FP16 = 14GB weights + ~4GB KV at batch=8, seq=2048. Use FP8/INT4 to halve/quarter weights."},
       {name:"Inference QPS",expr:"qps = (gpu_count × tokens_per_sec_per_gpu) / avg_output_tokens",note:"A100 vLLM 7B: ~3000 tok/s. Avg 200 output tokens → 15 QPS per GPU."},
       {name:"Cost per 1M tokens",expr:"cost = (gpu_hourly × 3600) / (tokens_per_sec × 1e6 / 1e6)",note:"Self-hosted Llama-3-70B on H100: ~$0.50–1.00/M tokens. GPT-4o: ~$2.50/M input."}
     ],
     antiPatterns:[
       {name:"One model fits all",desc:"Sending every query to GPT-4. 80% of queries can be handled by a 7B model at 1/100th the cost. Build a router."},
       {name:"Synchronous fan-out",desc:"Calling the LLM in the request path with no timeout/fallback. One slow LLM hop becomes your p99."}
     ],
     pitfalls:[
       {name:"Forgetting prompt caching",desc:"Long system prompts repeated on every call. Anthropic/OpenAI prompt caching cuts cost 90% on cached prefix. Self-hosted: KV cache reuse."},
       {name:"Output token blow-up",desc:"Not setting max_tokens. A runaway model can generate 4K tokens for a yes/no question, blowing your latency and cost budget."},
       {name:"Cold start cost",desc:"Loading a 70B model takes 30–120s. Don't autoscale to zero. Use min_replicas=1 even if expensive."}
     ],
     examples:[
       {name:"Character.AI",desc:"Custom serving stack with attention KV cache reuse across users (shared system prompt) → 33× lower cost than naive serving."},
       {name:"GitHub Copilot",desc:"Speculative decoding with smaller draft model — 2× speedup. Aggressive caching of partial completions."}
     ],
     related:[{id:"ml-vector",label:"Vector DB"},{id:"db-cache",label:"Caching"},{id:"compute-model",label:"Compute"}],
     children:[]},

    {name:"Vector Database",id:"ml-vector",icon:"📐",phase:"ML/AI",color:"#ec4899",
     sizes:["small","medium","large","hyper"],short:"pgvector → dedicated → sharded ANN at scale",
     detail:{what:"A database optimized for similarity search over high-dimensional embeddings. Foundation of RAG, semantic search, recommendation, and dedup.",
       why:"Exact KNN over millions of 1536-dim vectors is O(N×D) = too slow. Vector DBs use Approximate Nearest Neighbor (HNSW, IVF, ScaNN) for sub-linear search at >95% recall.",
       numbers:"HNSW recall@10: 95–99% with M=16, efSearch=64. Memory: ~4 bytes × dims × N for FP32, halve for FP16. 100M × 1536-dim FP32 = 600GB. Use product quantization for 8–32× compression."},
     tradeoffs:[{axis:"Recall vs Latency",left:"High efSearch: accurate",right:"Low efSearch: fast",pos:0.5},{axis:"Memory vs Disk",left:"In-memory: fast",right:"On-disk (DiskANN): cheap",pos:0.5}],
     sizes_cfg:{
       small:{range:"<1M vectors",rec:"Use pgvector inside your existing Postgres. No new infra. HNSW index. Plenty fast for <1M vectors at <50ms p99.",tools:["pgvector","sqlite-vss","Chroma (local)"]},
       medium:{range:"1M–50M vectors",rec:"Dedicated vector DB. Qdrant or Weaviate self-hosted. Or Pinecone (managed). Hybrid search (BM25 + vector) for better recall on keyword queries.",tools:["Qdrant","Weaviate","Pinecone","Milvus","Vespa"]},
       large:{range:"50M–10B vectors",rec:"Sharded vector DB. Two-stage retrieval: coarse (IVF) → fine (HNSW + reranker). Quantization to fit in memory. Filtered search with pre/post filtering tradeoffs.",tools:["Milvus cluster","Vespa","Qdrant cluster","Weaviate cluster"]},
       hyper:{range:">10B vectors, sub-10ms",rec:"Custom ANN built on FAISS/ScaNN. Multi-tier (in-memory hot + on-disk cold). GPU-accelerated search (cuVS). Hierarchical sharding by tenant + topic.",tools:["FAISS","ScaNN","cuVS (GPU)","DiskANN","custom inverted+vector hybrid"]}
     },
     levelUp:[],
     pitfalls:[
       {name:"Embedding model drift",desc:"Changing your embedding model invalidates the entire index. Re-embedding 1B vectors takes weeks. Pin your embedding model version."},
       {name:"Filter explosion",desc:"Heavy pre-filtering can collapse the candidate set below efSearch, killing recall. Use post-filtering or specialized indexes."},
       {name:"Dimension overkill",desc:"OpenAI text-embedding-3-large is 3072-dim by default but supports Matryoshka truncation to 256/512. Try smaller — often equal recall, 6× cheaper storage."}
     ],
     related:[{id:"db-search",label:"Search Layer"},{id:"ml-serve",label:"Model Serving"}],
     children:[]},

    {name:"Training & MLOps",id:"ml-train",icon:"🏋️",phase:"ML/AI",color:"#ec4899",
     sizes:["medium","large","hyper"],short:"Notebook → pipelines → distributed training",
     detail:{what:"The pipelines that take raw data, produce features, train models, evaluate, and deploy to serving infrastructure.",
       why:"Most ML projects fail in the gap between notebook and production. MLOps is the discipline that closes that gap with versioning, reproducibility, and continuous training.",
       numbers:"Training a 7B LLM from scratch: ~$100K–500K. Fine-tuning (LoRA): $10–500. Continuous pre-training: $5K–50K. Feature pipeline cost is often >50% of total ML infra spend."},
     tradeoffs:[{axis:"Train from scratch vs Fine-tune",left:"Custom: $$$ + months",right:"Fine-tune: cheap + days",pos:0.7},{axis:"Online vs Batch features",left:"Online: fresh, complex",right:"Batch: stale, simple",pos:0.5}],
     sizes_cfg:{
       medium:{range:"Few models, weekly retraining",rec:"Notebook → script → cron. Use managed training (SageMaker, Vertex AI). Track experiments with MLflow or W&B. Feature store optional.",tools:["MLflow","Weights & Biases","SageMaker","Vertex AI","DVC"]},
       large:{range:"10–100 models in production",rec:"Feature store (Feast/Tecton). Pipeline orchestrator (Airflow/Kubeflow/Dagster). Model registry. Shadow + canary deploys. Drift monitoring. Automated retraining on drift trigger.",tools:["Feast","Tecton","Kubeflow","Airflow","Dagster","Seldon","BentoML"]},
       hyper:{range:"Foundation model training + fleet of fine-tunes",rec:"Distributed training: FSDP/DeepSpeed Zero-3 + tensor parallel + pipeline parallel. RDMA InfiniBand cluster. Custom data loaders. Checkpoint sharding. RLHF/DPO pipelines.",tools:["DeepSpeed","Megatron-LM","FSDP","Ray Train","SLURM","custom training stack"]}
     },
     levelUp:[],
     related:[{id:"analytics",label:"Analytics"},{id:"ops",label:"DevOps"}],
     children:[]}
  ]
};
