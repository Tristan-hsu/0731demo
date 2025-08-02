"""
Quart API - 簡化版占星助手 API
使用 Quart 框架，提供流式聊天功能
"""

import asyncio
import json
import time
import traceback
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from quart import Quart, request, Response
from quart_cors import cors
import uvicorn

# Local imports
from agents.enhanced_astro_agent import get_enhanced_agent, initialize_agent


# Global variables
agent_instance = None
app = Quart(__name__)

# Add CORS support
app = cors(app, allow_origin="*")


@app.before_serving
async def startup():
    """服務啟動時初始化"""
    global agent_instance
    print("🚀 正在啟動Quart API服務...")
    
    try:
        agent_instance = await initialize_agent()
        print("✅ Enhanced Astro Agent 初始化成功")
    except Exception as e:
        print(f"❌ Agent初始化失敗: {e}")
        agent_instance = None


@app.route("/health", methods=["GET"])
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.route("/agent/status", methods=["GET"])
async def get_agent_status():
    """獲取Agent狀態"""
    global agent_instance
    
    if agent_instance is None:
        return {
            "status": "not_initialized",
            "agent_info": {
                "agent_initialized": False,
                "error": "Agent未初始化"
            },
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        agent_info = agent_instance.get_agent_info()
        status = "ready" if agent_info.get("agent_initialized", False) else "initializing"
        
        return {
            "status": status,
            "agent_info": agent_info,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "agent_info": {"error": str(e)},
            "timestamp": datetime.now().isoformat()
        }


@app.route("/chat/stream", methods=["POST"])
async def chat_stream():
    """流式聊天端點 - 支持 Server-Sent Events (SSE)"""
    global agent_instance
    
    if agent_instance is None:
        return {"error": "Agent未初始化"}, 500
    
    try:
        # 獲取請求數據
        data = await request.get_json()
        query = data.get("query", "")
        user_id = data.get("user_id", "anonymous")
        session_id = data.get("session_id", f"session_{int(time.time())}")
        include_rag = data.get("include_rag", True)
        
        if not query:
            return {"error": "查詢內容不能為空"}, 400
        
        async def generate():
            """SSE事件生成器"""
            last_heartbeat = time.time()
            heartbeat_interval = 30  # 30秒心跳間隔
            
            try:
                # 調用agent的流式處理方法
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
        
        return Response(
            generate(),
            mimetype='text/event-stream',
        )
        
    except Exception as e:
        print(f"❌ 請求處理失敗: {e}")
        print(traceback.format_exc())
        return {"error": f"請求處理失敗: {str(e)}"}, 500


@app.route("/chat", methods=["POST"])
async def chat():
    """同步聊天端點"""
    global agent_instance
    
    if agent_instance is None:
        return {"error": "Agent未初始化"}, 500
    
    try:
        data = await request.get_json()
        query = data.get("query", "")
        include_rag = data.get("include_rag", True)
        session_id = data.get("session_id")
        
        if not query:
            return {"error": "查詢內容不能為空"}, 400
        
        # 收集流式回應
        full_response = ""
        rag_context = []
        tools_used = []
        
        async for chunk in agent_instance.astream(query, include_rag=include_rag):
            if chunk.startswith("data: "):
                try:
                    chunk_data = json.loads(chunk[6:])
                    
                    if chunk_data.get("type") == "rag_context":
                        rag_context = chunk_data.get("context", [])
                    elif chunk_data.get("chunk"):
                        full_response += chunk_data.get("chunk", "")
                    elif chunk_data.get("type") == "tool_use":
                        tool_name = chunk_data.get("tool_name", "")
                        if tool_name and tool_name not in tools_used:
                            tools_used.append(tool_name)
                    elif chunk_data.get("content"):
                        full_response += chunk_data.get("content", "")
                        
                except json.JSONDecodeError:
                    pass
        
        return {
            "response": full_response.strip(),
            "rag_context": rag_context,
            "tools_used": tools_used,
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"❌ 聊天處理失敗: {e}")
        print(traceback.format_exc())
        return {"error": f"處理查詢時發生錯誤：{str(e)}"}, 500


@app.errorhandler(Exception)
async def handle_exception(error):
    """全局異常處理器"""
    print(f"❌ 全局異常: {error}")
    print(traceback.format_exc())
    
    return {
        "error": "內部服務器錯誤",
        "detail": str(error),
        "timestamp": datetime.now().isoformat()
    }, 500


def run_server(host: str = "0.0.0.0", port: int = 8000, debug: bool = False):
    """運行Quart服務器"""
    print(f"🌐 啟動Quart服務器 http://{host}:{port}")
    app.run(
        host=host,
        port=port,
        debug=debug,
        use_reloader=debug
    )


if __name__ == "__main__":
    # 直接運行服務器
    run_server(debug=True) 