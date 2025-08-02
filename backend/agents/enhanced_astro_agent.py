"""
Enhanced Astro Agent - 整合LangGraph ReActAgent + MCP工具 + RAG檢索
基於開發計劃實現智能占星助手的核心Agent邏輯
"""

import json
import asyncio
import os
from typing import List, Dict, Any, AsyncGenerator
from pathlib import Path

# LangGraph and LangChain imports
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from langchain_openai import AzureChatOpenAI
from langchain.callbacks.tracers import LangChainTracer 
# MCP adapter imports
try:
    from langchain_mcp_adapters.client import MultiServerMCPClient
except ImportError:
    print("Warning: langchain-mcp-adapters not available, MCP tools disabled")
    MultiServerMCPClient = None

# Local imports
from .tools.rag_tool import get_rag_tools
from .client.pinecone_client import PineconeClient
from .tools.natal_tool import natal_figure


class EnhancedAstroAgent:
    """
    增強型占星Agent
    整合LangGraph ReActAgent、MCP工具和RAG檢索功能
    """
    
    def __init__(self):
        """初始化Enhanced Astro Agent"""
        self.agent = None
        self.llm = None
        self.mcp_client = None
        self.rag_tools = []
        self.system_prompt = ""
        self.pinecone_client = PineconeClient()
        self.tracer = LangChainTracer(project_name="test")
        # 載入系統提示
        self._load_system_prompt()
        
    def _load_system_prompt(self):
        """載入astrology_mcp.json系統提示"""
        try:
            prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "astrology_mcp.json")
            with open(prompt_path, "r", encoding="utf-8") as file:
                loaded_data = json.load(file)
                self.system_prompt = json.dumps(loaded_data, ensure_ascii=False, indent=2)
                print(f"✅ 系統提示載入成功: {len(self.system_prompt)} 字符")
        except Exception as e:
            print(f"Warning: Failed to load astrology_mcp.json: {e}")
            self.system_prompt = "You are a professional astrologer assistant."
    
    async def initialize(self):
        """初始化Agent和所有工具"""
        print("🚀 正在初始化Enhanced Astro Agent...")
        
        # 1. 初始化LLM
        await self._initialize_llm()
        
        # 2. 初始化MCP工具
        await self._initialize_mcp_tools()
        
        # 3. 初始化RAG工具
        self._initialize_rag_tools()
        
        # 4. 創建ReActAgent
        await self._create_react_agent()
        
        print("✅ Enhanced Astro Agent 初始化完成！")
    
    async def _initialize_llm(self):
        """初始化語言模型"""
        try:
            # 使用Azure OpenAI作為LangGraph的LLM
            self.llm = AzureChatOpenAI(
                azure_endpoint=os.getenv("AZURE_API_END", "https://x7048-m50qpz5s-eastus2.cognitiveservices.azure.com/"),
                api_key=os.getenv("AZURE_API_KEY"),
                api_version="2025-01-01-preview",
                azure_deployment="gpt-4.1",
                temperature=0.7,
                max_tokens=4096
            )
            print("✅ LLM 初始化成功")
        except Exception as e:
            print(f"❌ LLM 初始化失敗: {e}")
            raise
    
    async def _initialize_mcp_tools(self):
        """初始化MCP工具"""
        if MultiServerMCPClient is None:
            print("⚠️ MCP工具不可用，跳過MCP初始化")
            return

        try:
            # 檢查可用的MCP工具
            available_tools = {}

            # 檢查web-search工具
            web_search_path = Path(os.path.join(os.path.dirname(__file__), "MCP", "web-search", "build", "index.js"))
            if web_search_path.exists() and os.getenv("SEARCH_API_KEY"):
                available_tools["web_search"] = {
                    "command": "node",
                    "args": [str(web_search_path.absolute())],
                    "transport": "stdio",
                    "env": {
                        "SEARCH_API_KEY": os.getenv("SEARCH_API_KEY", "")
                    }
                }
                print(f"✅ 發現web-search工具: {web_search_path}")
            else:
                print("⚠️ web-search工具不可用（文件不存在或缺少API密鑰）")

            # 檢查AstroMCP工具（使用構建後的文件）
            astro_dist_path = Path(os.path.join(os.path.dirname(__file__), "MCP", "AstroMCP", "dist", "main.js"))
            if astro_dist_path.exists():
                available_tools["astro_mcp"] = {
                    "command": "node",
                    "args": [str(astro_dist_path.absolute())],
                    "transport": "stdio"
                }
                print(f"✅ 發現AstroMCP工具: {astro_dist_path}")
            else:
                astro_src_path = Path(os.path.join(os.path.dirname(__file__), "MCP", "AstroMCP", "index.ts"))
                if astro_src_path.exists():
                    print("⚠️ AstroMCP源文件存在但未構建，請運行: cd backend/agents/MCP/AstroMCP && npm run build")
                else:
                    print("⚠️ AstroMCP工具不可用")

            # # 檢查Natal MCP工具（Python）
            # natal_mcp_path = Path("natal_mcp/run.py")
            # venv_python = Path("venv312/Scripts/python.exe")
            # if natal_mcp_path.exists() and venv_python.exists():
            #     available_tools["natal_mcp"] = {
            #         "command": str(venv_python.absolute()),
            #         "args": [str(natal_mcp_path.absolute())],
            #         "transport": "stdio"
            #     }
            #     print(f"✅ 發現Natal MCP工具: {natal_mcp_path}")
            # else:
            #     if not natal_mcp_path.exists():
            #         print("⚠️ Natal MCP工具不可用（文件不存在）")
            #     if not venv_python.exists():
            #         print("⚠️ Python 3.12虛擬環境不可用")

            if available_tools:
                # 初始化MCP客戶端
                self.mcp_client = MultiServerMCPClient(available_tools)
                print(f"✅ MCP工具初始化成功，載入 {len(available_tools)} 個工具")
            else:
                print("⚠️ 沒有可用的MCP工具，使用RAG模式")
                self.mcp_client = None

        except Exception as e:
            print(f"⚠️ MCP工具初始化失敗: {e}")
            self.mcp_client = None
    
    def _initialize_rag_tools(self):
        """初始化RAG工具和星圖工具"""
        try:
            # 載入RAG工具
            self.rag_tools = get_rag_tools()

            # 添加natal chart工具
            self.rag_tools.append(natal_figure)

            # 載入星圖生成工具
            # self.rag_tools.extend(chart_tools)

            print(f"✅ RAG和星圖工具初始化成功，載入 {len(self.rag_tools)} 個工具")
        except Exception as e:
            print(f"⚠️ RAG工具初始化失敗: {e}")
            self.rag_tools = []
    
    async def _create_react_agent(self):
        """創建LangGraph ReActAgent"""
        try:
            # 收集所有工具
            all_tools = []
            
            # 添加RAG工具
            all_tools.extend(self.rag_tools)
            
            # 添加MCP工具（如果可用）
            if self.mcp_client:
                try:
                    mcp_tools = await self.mcp_client.get_tools()
                    all_tools.extend(mcp_tools)
                    print(f"✅ 載入 {len(mcp_tools)} 個MCP工具")
                except Exception as e:
                    print(f"⚠️ 無法載入MCP工具: {e}")
            
            # 創建ReActAgent
            if all_tools:
                self.agent = create_react_agent(
                    model=self.llm, 
                    tools=all_tools,
                    prompt=self.system_prompt
                )
                print(f"✅ ReActAgent創建成功，總共 {len(all_tools)} 個工具")
            else:
                print("⚠️ 沒有可用工具，創建基礎Agent")
                self.agent = create_react_agent(
                    model=self.llm, 
                    tools=[],
                    prompt=self.system_prompt
                )
                
        except Exception as e:
            print(f"❌ ReActAgent創建失敗: {e}")
            raise
    
    async def astream(self, user_input: str, include_rag: bool = True) -> AsyncGenerator[str, None]:
        """
        流式處理用戶查詢
        
        Args:
            user_input (str): 用戶輸入
            include_rag (bool): 是否包含RAG檢索
            
        Yields:
            str: SSE格式的流式回應
        """
        if not self.agent:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Agent未初始化'}, ensure_ascii=False)}\n\n"
            return
            
        try:
            # 可選的RAG檢索
            rag_context = []
            if include_rag:
                rag_context = await self._get_rag_context(user_input)
                if rag_context:
                    yield f"data: {json.dumps({'type': 'rag_context', 'context': rag_context}, ensure_ascii=False)}\n\n"
            
            # 使用ReActAgent流式處理查詢
            message = HumanMessage(content=user_input)
            
            async for event in self.agent.astream_events(
                {"messages": [message]},
                config={"callbacks": [self.tracer]},
                version="v1",
            ):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    chunk_data = event["data"].get("chunk")
                    if chunk_data and hasattr(chunk_data, "content"):
                        content = chunk_data.content or ""
                        if content:
                            yield f"data: {json.dumps({'chunk': content}, ensure_ascii=False)}\n\n"
                            
                elif kind == "on_chat_model_start":
                    # 開始新的回應
                    if not hasattr(self, "_first_model_start_skipped"):
                        self._first_model_start_skipped = True
                    else:
                        yield f"data: {json.dumps({'type': 'start_response', 'content': ''}, ensure_ascii=False)}\n\n"
                        
                elif kind == "on_tool_start":
                    tool_id = event["run_id"]
                    tool_name = event["name"]
                    tool_args = event["data"].get("input")
                    yield f"data: {json.dumps({'role': 'ai', 'type': 'tool_use', 'tool_id': tool_id, 'tool_name': tool_name, 'tool_args': tool_args, 'content': f'正在使用工具 {tool_name}...'}, ensure_ascii=False)}\n\n"
                    
                elif kind == "on_tool_end":
                    tool_id = event["run_id"]  
                    tool_name = event["name"]
                    tool_result = event["data"].get("output")
                    result_content = tool_result.content if hasattr(tool_result, 'content') else str(tool_result)
                    yield f"data: {json.dumps({'role': 'ai', 'type': 'tool_result', 'tool_name': tool_name, 'tool_id': tool_id, 'tool_result': result_content}, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            print(f"❌ 流式查詢處理失敗: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': f'處理查詢時發生錯誤：{str(e)}'}, ensure_ascii=False)}\n\n"
    
    async def _get_rag_context(self, query: str) -> List[Dict]:
        """獲取RAG上下文"""
        try:
            return self.pinecone_client.search_rag_context(
                user_query=query,
                index_name="astrology-text",
                namespace="hierarchy_chunking_strategy",
                top_k=5
            )
        except Exception as e:
            print(f"⚠️ RAG檢索失敗: {e}")
            return []
    

    
    def get_agent_info(self) -> Dict[str, Any]:
        """獲取Agent資訊"""
        return {
            "agent_initialized": self.agent is not None,
            "llm_available": self.llm is not None,
            "mcp_available": self.mcp_client is not None,
            "rag_tools_count": len(self.rag_tools),
            "system_prompt_loaded": bool(self.system_prompt)
        }


# 全局Agent實例
_enhanced_agent = None


async def get_enhanced_agent() -> EnhancedAstroAgent:
    """獲取全局Enhanced Astro Agent實例"""
    global _enhanced_agent
    if _enhanced_agent is None:
        _enhanced_agent = EnhancedAstroAgent()
        await _enhanced_agent.initialize()
    return _enhanced_agent


async def initialize_agent() -> EnhancedAstroAgent:
    """初始化Agent（強制重新初始化）"""
    global _enhanced_agent
    _enhanced_agent = EnhancedAstroAgent()
    await _enhanced_agent.initialize()
    return _enhanced_agent


if __name__ == "__main__":
    # 測試Agent流式輸出
    async def test_agent_stream():
        print("🧪 測試Enhanced Astro Agent 流式輸出...")
        
        agent = await initialize_agent()
        
        # 測試查詢
        test_queries = [
            "請幫我分析2000年1月18日下午7點在台北出生的星盤"
        ]
        
        for query in test_queries:
            print(f"\n📝 查詢：{query}")
            print("🔄 開始流式回應：")
            print("-" * 50)
            
            # # 使用流式處理
            # async for chunk in agent.astream(query):
            #     print(chunk, end="", flush=True)
            
            # print("\n" + "-" * 50)
    
    # 運行測試
    asyncio.run(test_agent_stream())
