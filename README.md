# 智能占星助手 - Intelligent Astrology Assistant

## 🌟 項目簡介

這是一個整合了多種AI技術的智能占星助手系統，結合了：

- **LangGraph ReActAgent** - 核心推理引擎
- **MCP (Model Context Protocol) 工具** - 網路搜尋和占星計算
- **RAG (Retrieval-Augmented Generation)** - 占星學知識庫檢索
- **Azure OpenAI GPT-4** - 語言模型
- **FastAPI** - 後端API服務
- **繁體中文前端界面** - 包含星圖顯示功能

## 🏗️ 系統架構

```
用戶輸入 → ReActAgent → 工具選擇器 → 多工具執行 → 結果整合 → 占星分析
                           ↓
                    ┌─ RAG搜尋工具 ────┐
                    ├─ WebSearchMCP ───┤ → 知識融合 → 專業解讀
                    └─ AstroMCP ───────┘
```

## 📁 檔案結構

```
0730demo/
├── enhanced_astro_agent.py    # 主Agent邏輯
├── astrology_mcp.json         # Agent系統提示配置
├── rag_tool.py               # RAG工具包裝器
├── integrated_api.py         # FastAPI後端服務
├── simple_astro_ui.html      # 前端界面
├── config.py                 # 配置管理
├── pinecone_client.py        # Pinecone向量數據庫客戶端
├── gpt4o_client.py          # GPT-4客戶端
├── fixed_openai_clients.py   # 修復的OpenAI客戶端
├── start_server.py          # 服務器啟動腳本
├── requirements.txt         # Python依賴
├── .env                     # 環境配置
└── README.md               # 本文檔
```

## 🚀 快速開始

### 1. 環境準備

```bash
# 創建虛擬環境
python -m venv venv

# 激活虛擬環境 (Windows)
source venv/Scripts/activate

# 安裝Python依賴
pip install -r requirements.txt
```

### 2. 安裝MCP工具

```bash
# 安裝Node.js依賴
cd web-search && npm install && cd ..
cd AstroMCP && npm install && cd ..
cd astrochart && npm install && cd ..
```

### 3. 配置環境變數

編輯 `.env` 文件，設置您的API密鑰：

```env
# Azure OpenAI
AZURE_API_END=your_azure_endpoint
AZURE_API_KEY=your_api_key
AZURE_DEPLOY=gpt-4.1

# Pinecone RAG
PINECONE_API_KEY=your_pinecone_key
EMBED_KEY=your_embed_key

# 搜尋工具
SEARCH_API_KEY=your_search_api_key
```

### 4. 啟動服務

```bash
# 使用啟動腳本
python start_server.py

# 或直接啟動
python integrated_api.py
```

### 5. 訪問前端

打開瀏覽器訪問：`http://localhost:8000`

然後打開 `simple_astro_ui.html` 文件

## 🔧 核心功能

### RAG知識檢索
- 使用Pinecone搜尋占星學理論知識庫
- 支援相似度閾值過濾
- 自動格式化檢索結果

### 網路資訊收集
- Web Search MCP工具搜尋最新占星資訊
- 實時天象資訊查詢

### 星圖計算生成
- AstroMCP工具計算星體位置
- 生成個人出生星盤
- 星圖可視化顯示

### 智能工具選擇
- ReActAgent根據問題自動選擇最適合的工具
- 多工具協同工作
- 結果智能整合

## 🌐 前端界面特色

- **簡潔設計**: 單頁應用，操作直觀
- **繁體中文**: 完整本地化界面
- **即時對話**: 支援實時問答
- **快速問題**: 預設常見占星問題按鈕
- **星圖顯示**: 自動生成並顯示星圖
- **工具追蹤**: 顯示AI使用了哪些工具
- **系統狀態**: 實時顯示各組件狀態

## 🧪 測試功能

### 核心功能測試
- **RAG檢索**: "什麼是上升星座？"
- **網路搜尋**: "2024年水星逆行時間"
- **星圖生成**: "1992/12/18 15:00 台北出生星盤"
- **綜合分析**: "金星第七宮對感情的影響"

### API端點
- `GET /health` - 健康檢查
- `GET /agent/status` - Agent狀態
- `POST /chat` - 聊天對話
- `POST /chat/stream` - 流式聊天
- `GET /tools` - 可用工具列表

## 🛠️ 開發說明

### 添加新工具
1. 在 `rag_tool.py` 中添加新的工具函數
2. 使用 `@tool` 裝飾器標記
3. 在 `enhanced_astro_agent.py` 中註冊工具

### 修改系統提示
編輯 `astrology_mcp.json` 文件來調整Agent的行為和回應風格

### 自定義配置
在 `config.py` 中添加新的配置項，並在 `.env` 文件中設置對應的環境變數

## 🔍 故障排除

### 常見問題

1. **導入錯誤**: 確保虛擬環境已激活並安裝了所有依賴
2. **API密鑰錯誤**: 檢查 `.env` 文件中的API密鑰配置
3. **Pinecone連接失敗**: 確認Pinecone API密鑰和索引名稱正確
4. **MCP工具不可用**: 檢查Node.js依賴是否正確安裝

### 日誌查看
服務器運行時會在控制台輸出詳細的日誌信息，包括：
- 組件初始化狀態
- API請求處理
- 工具調用記錄
- 錯誤信息

## 📊 系統要求

- Python 3.8+
- Node.js 16+
- 8GB+ RAM (推薦)
- 網路連接 (用於API調用)

## 🎯 成功指標

- ✅ 能正確回答占星學理論問題 (RAG準確率 >80%)
- ✅ 能搜尋到相關的最新占星資訊 (搜尋成功率 >90%)
- ✅ 能生成準確的個人星圖數據 (計算準確性 100%)
- ✅ 用戶界面響應流暢 (響應時間 <5秒)
- ✅ 支援繁體中文問答 (本地化完整度 100%)

## 📝 版本信息

- **版本**: 1.0.0
- **開發日期**: 2025-07-30
- **技術棧**: LangGraph + MCP + RAG + FastAPI + Azure OpenAI

---

*本項目基於LangGraph ReActAgent技術，整合RAG檢索、MCP工具鏈，實現智能占星諮詢系統。*
