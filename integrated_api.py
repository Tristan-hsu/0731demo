"""
Integrated API - FastAPI後端服務
整合Enhanced Astro Agent，提供RESTful API接口
"""

import asyncio
import json
import time
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ConfigDict
import uvicorn

# Local imports
from enhanced_astro_agent import get_enhanced_agent, initialize_agent


# Pydantic models for API requests/responses
class ChatRequest(BaseModel):
    """聊天請求模型"""
    model_config = ConfigDict(extra="ignore")
    
    query: str = Field(..., description="用戶查詢內容")
    include_rag: bool = Field(default=True, description="是否包含RAG檢索")
    session_id: Optional[str] = Field(default=None, description="會話ID")
    user_id: Optional[str] = Field(default=None, description="用戶ID")


class ChatResponse(BaseModel):
    """聊天回應模型"""
    response: str = Field(..., description="AI回應內容")
    rag_context: List[Dict] = Field(default=[], description="RAG檢索上下文")
    tools_used: List[str] = Field(default=[], description="使用的工具列表")
    success: bool = Field(..., description="請求是否成功")
    timestamp: str = Field(..., description="回應時間戳")
    session_id: Optional[str] = Field(None, description="會話ID")
    chart_file: Optional[str] = Field(None, description="生成的星圖文件路徑")


class AgentStatusResponse(BaseModel):
    """Agent狀態回應模型"""
    status: str = Field(..., description="Agent狀態")
    agent_info: Dict[str, Any] = Field(..., description="Agent詳細資訊")
    timestamp: str = Field(..., description="狀態檢查時間戳")


class HealthResponse(BaseModel):
    """健康檢查回應模型"""
    status: str = Field(..., description="服務狀態")
    timestamp: str = Field(..., description="檢查時間戳")
    version: str = Field(..., description="API版本")


# Global variables
agent_instance = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用生命週期管理"""
    # Startup
    print("🚀 正在啟動Integrated API服務...")
    
    global agent_instance
    try:
        agent_instance = await initialize_agent()
        print("✅ Enhanced Astro Agent 初始化成功")
    except Exception as e:
        print(f"❌ Agent初始化失敗: {e}")
        agent_instance = None
    
    yield
    
    # Shutdown
    print("🛑 正在關閉Integrated API服務...")


# Create FastAPI app
app = FastAPI(
    title="智能占星助手 API",
    description="整合LangGraph ReActAgent + MCP工具 + RAG檢索的占星諮詢API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該限制具體域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for charts
app.mount("/charts", StaticFiles(directory="charts"), name="charts")


@app.get("/", response_model=HealthResponse)
async def root():
    """根路徑健康檢查"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康檢查端點"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )


@app.get("/agent/status", response_model=AgentStatusResponse)
async def get_agent_status():
    
    """獲取Agent狀態"""
    global agent_instance
    
    if agent_instance is None:
        return AgentStatusResponse(
            status="not_initialized",
            agent_info={
                "agent_initialized": False,
                "error": "Agent未初始化"
            },
            timestamp=datetime.now().isoformat()
        )
    
    try:
        agent_info = agent_instance.get_agent_info()
        status = "ready" if agent_info.get("agent_initialized", False) else "initializing"
        
        return AgentStatusResponse(
            status=status,
            agent_info=agent_info,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        return AgentStatusResponse(
            status="error",
            agent_info={"error": str(e)},
            timestamp=datetime.now().isoformat()
        )

@app.get("/tools")
async def get_available_tools():
    """獲取可用工具列表"""
    global agent_instance
    
    if agent_instance is None:
        return {"tools": [], "message": "Agent未初始化"}
    
    try:
        agent_info = agent_instance.get_agent_info()
        return {
            "rag_tools_count": agent_info.get("rag_tools_count", 0),
            "mcp_available": agent_info.get("mcp_available", False),
            "agent_initialized": agent_info.get("agent_initialized", False),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "timestamp": datetime.now().isoformat()}

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式聊天端點 - 支持 Server-Sent Events (SSE)"""
    global agent_instance
    
    if agent_instance is None:
        raise HTTPException(status_code=500, detail="Agent未初始化")
    
    # 提取請求參數
    query = request.query
    user_id = request.user_id or "anonymous"
    session_id = request.session_id or f"session_{int(time.time())}"
    include_rag = request.include_rag
    
    async def generate():
        """SSE事件生成器"""
        last_heartbeat = time.time()
        heartbeat_interval = 30  # 30秒心跳間隔
        
        try:
            async for response in agent_instance.astream(query, include_rag=include_rag):
                yield response
                
                # 檢查是否需要發送心跳
                current_time = time.time()
                if current_time - last_heartbeat > heartbeat_interval:
                    yield ": heartbeat\n\n"  # SSE格式的註釋行
                    last_heartbeat = current_time
            
        except Exception as e:
            print(f"❌ 流式聊天處理失敗: {e}")
            print(traceback.format_exc())
            # 發送錯誤事件
            yield f"data: {json.dumps({'type': 'error', 'message': f'生成回應時發生錯誤: {str(e)}'}, ensure_ascii=False)}\n\n"
        finally:
            # 發送流結束標記
            yield f"data: {json.dumps({'type': 'stream_end', 'session_id': session_id, 'timestamp': datetime.now().isoformat()}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用nginx緩衝
            "Access-Control-Allow-Origin": "*",  # CORS支持
            "Access-Control-Allow-Headers": "Cache-Control",
        }
    )


# 錯誤處理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局異常處理器"""
    print(f"❌ 全局異常: {exc}")
    print(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "內部服務器錯誤",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """運行FastAPI服務器"""
    print(f"🌐 啟動FastAPI服務器 http://{host}:{port}")
    uvicorn.run(
        "integrated_api:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    # 直接運行服務器
    run_server(reload=True)
