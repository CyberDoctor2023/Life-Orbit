# Developer Guide (Technical Documentation)

此文档面向开发者，详细阐述 Life Orbit 的技术栈、架构设计与核心功能实现原理。

## 1. 技术栈 (Tech Stack)

### Frontend Core
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: TailwindCSS (Utility-first logic)

### State & Logic
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (全局状态管理)
- **Routing**: React Router DOM (v7)
- **UI Feedback**: [Sonner](https://sonner.emilkowal.ski/) (Toasts)

### AI & Data
- **LLM / Embedding**: Google Gemini 2.0 Flash via `@google/genai` SDK
- **Database**: Native [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (NoSQL Local Storage)
- **Icons**: Lucide React

---

## 2. 架构概览 (Architecture)

项目采用 **Local-First (本地优先)** 架构，所有数据存储在用户浏览器中，AI 能力通过 API 调用但数据处理逻辑（如 RAG 检索）在前端完成。

```mermaid
graph TD
    UI[React UI Components] --> Store[Zustand Store (useAppStore)]
    Store --> Services
    
    subgraph Services
        DB[dbService (IndexedDB)]
        RAG[ragService (Vector Ops)]
        AI[geminiService (LLM)]
    end
    
    RAG --> AI
    Store --> DB
```

### 核心目录结构
```bash
/src
  /components     # UI 组件 (OrbitVisualizer, MemoryBank...)
  /services       # 核心业务逻辑 (无 UI)
    dbService.ts  # IndexedDB 封装
    ragService.ts # 向量计算与语义检索
    geminiService.ts # AI 交互
  /store          # Zustand 全局状态
  /types          # TypeScript 定义
```

---

## 3. 核心实现细节 (Implementation Details)

### 3.1 本地向量数据库 (Local Vector Persistence)
我们没有使用专业的 Vector DB (如 Pinecone)，而是利用 IndexedDB 构建了一个轻量级本地向量库。
- **存储**: `Thought` 对象中包含 `vector: number[]` 字段 (768维)。
- **持久化**: `dbService.ts` 封装了 `IDBDatabase`，将数据存入 `thoughts` ObjectStore。

### 3.2 客户端 RAG (Client-side RAG)
由于个人知识库通常小于 10,000 条，我们在前端直接进行向量计算，无需后端向量服务。
- **文件**: `services/ragService.ts`
- **流程**:
    1. 用户输入查询 query。
    2. 调用 Gemini API `text-embedding-004` 获取 query 向量。
    3. **内存计算**: 遍历所有本地 Thought，计算 **余弦相似度 (Cosine Similarity)**。
    4. 排序并截取 Top-K 结果。
- **性能**: 在现代浏览器中，计算 10k 个 768维向量的点积耗时仅需数毫秒。

### 3.3 轨道可视化 (Orbit Visualizer)
- **实现**: 纯 SVG + React 状态驱动。
- **物理模拟**: 
    - 每一层轨道 (Survival, Growth, Vision) 都有独立的半径和角速度。
    - 使用 `requestAnimationFrame` 驱动 `rotation` 状态，实现公转动画。
- **交互**: 实现了 SVG 坐标系的拖拽逻辑 (`getScreenCTM`)，允许用户将节点在不同轨道间拖拽，从而触发 `updateThoughtLevel`。

### 3.4 AI 分类引擎
- **逻辑**: 当用户输入新想法时，`processWithRealRAG` 会：
    1. 获取 Embeddings。
    2. 检索历史相似想法（RAG Context）。
    3. 将【新想法】+【历史 Context】发送给 LLM。
    4. LLM 输出 JSON，决定该想法属于哪个轨道层级 (Survival/Growth/Vision)。

---

## 4. 环境变量 (Environment Variables)

项目依赖 Google Gemini API。
`.env.local` 文件必须包含：

```env
GEMINI_API_KEY=your_key_here
```

---

## 5. 开发建议 (Development)

- **添加新功能**: 优先在 `store/useAppStore.ts` 中定义 Action，保持 UI 组件纯净。
- **性能优化**: 如果数据量超过 10k，考虑将 `ragService` 的计算逻辑移至 Web Worker 避免阻塞主线程。
