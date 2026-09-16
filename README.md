# Saturday — World-Class AI Chatbot Platform

> **Calm · Intelligent · Personal · Premium · Minimal · Fluid · Compact · Human**

Saturday is an editorial AI digital companion built on white luxury design, subtle liquid glass, typographic hierarchy, responsive layout systems, dynamic multi-provider AI discovery, autonomous routing, and complete administrative control.

---

## 🌟 Architectural Highlights

### 1. Visual Direction & UX Principle
- **Soft White Luxury & Subtle Liquid Glass**: Functional glass surfaces with controlled blur, fine borders, and specular highlights without noisy neon aesthetics.
- **Fluid Responsive Layout System**: Built on Flexbox, CSS Grid, container queries, and clamp sizing. Fluidly adapts from mobile phones to ultrawide monitors.
- **Editorial Typography**: Styled with Google's *Outfit* for primary prose and *Space Grotesk* / *JetBrains Mono* for technical metadata.
- **Editorial Reading Environment**: Markdown headings, lists, tables, syntax-highlighted code blocks with line numbering & copy, and KaTeX mathematical equation rendering ($inline$ and $$block$$).

### 2. Multi-Provider AI Architecture & Dynamic Discovery
- **Provider Abstraction Layer** (`AIProvider` interface):
  - **NVIDIA NIM**: High-throughput inference accelerated on NVIDIA DGX Cloud, dynamic discovery via `/v1/models`, SSE streaming, ping health checks.
  - **OpenRouter Free**: Dynamic discovery of certified `:free` models (`meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-coder-32b-instruct:free`, `gemini-2.0-flash-exp:free`).
  - **Cloudflare AI**: Serverless edge inference (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`).
  - **Saturday Neural Engine**: Zero-latency built-in streaming engine that ensures 100% immediate out-of-the-box operation even before external keys are configured.
- **Provider Secret Isolation**: API keys (`NVIDIA_NIM_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_API_KEY`) are managed exclusively in backend infrastructure and the secure Admin Vault; secrets are never transmitted to browser bundles.

### 3. Dynamic Model Discovery & Health Check System
- **Model Health States**: `WORKING`, `DEGRADED`, `RATE_LIMITED`, `AUTH_FAILED`, `NOT_FOUND`, `UNSUPPORTED`, `TIMEOUT`, `ERROR`.
- **TTL-Based Caching & Safe Throttling**: Health checks are cached with 3-minute TTL to protect rate limits and prevent quota waste.
- **Live Verification**: Admins and users can trigger live ping verification tests directly in the UI.

### 4. Autonomous Routing Pipeline
- **Smart Router**:
  - Classifies user intent (`reasoning`, `coding`, `vision`, `long_context`, `json`, `general`).
  - Matches required capabilities with candidate models.
  - Ranks candidates by uptime, health, and latency.
  - **Automatic Edge Fallback**: If a primary provider encounters a rate limit or 5xx outage, the pipeline seamlessly fails over to the next healthy model.
  - **Routing Transparency**: Clickable routing pill reveals the exact classification reason, confidence score, model/provider used, and failover trace.
- **Free Router**:
  - Guarantees zero infrastructure cost by restricting selection strictly to verified free tier models.

### 5. Advanced Frontend Features
- **Floating Liquid-Glass Composer**: Auto-expanding textarea, drag-and-drop & paste attachments (images, code, documents), voice mode trigger, quick model selector pill, send/stop controls.
- **Voice Mode**: Real-time animated audio visualizer waves, Web Speech API speech-to-text recognition, and speech synthesis voice output.
- **Global Search (`Cmd+K` / `Ctrl+K`)**: Instant search across conversation titles and message content with snippet highlighting.
- **Settings**: Appearance (Light, Dark, System), Compact mode, Enter-to-send, Timestamps, Voice speed, Export data, and Clear history.
- **Admin / CMS Portal**:
  - System Overview & Metrics Dashboard
  - Provider Key Vault & Connection Ping Tester
  - Dynamic Model Catalog, Capability Overrides & Manual Health Checks
  - Autonomous Router Scoring Weights & Fallback Policies
  - Content Management (Welcome headlines, curated prompt suggestions CRUD, announcements)
  - System Audit Telemetry Logs

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start unified development server (API + Vite frontend on port 3000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 🔒 Security & Secrets Configuration

Add your provider keys in `.env` or directly through the Saturday Admin Portal:

```env
NVIDIA_NIM_API_KEY=nvapi-...
OPENROUTER_API_KEY=sk-or-...
CLOUDFLARE_API_KEY=...
PORT=3000
```
