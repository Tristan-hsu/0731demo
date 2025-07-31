"""
RAG工具包裝器 - 將Pinecone RAG功能包裝為LangChain工具
基於開發計劃中的規格實現占星學知識庫搜尋功能
"""

import json
from typing import List, Dict, Optional
from langchain_core.tools import tool
from pinecone_client import PineconeClient


class AstrologyRAGTool:
    """占星學RAG工具類"""
    
    def __init__(self):
        """初始化RAG工具"""
        self.client = PineconeClient()
        self.similarity_threshold = 0.7  # 相似度閾值
    
    def format_results(self, results: List[Dict]) -> str:
        """
        格式化RAG搜尋結果為可讀文本
        
        Args:
            results: Pinecone搜尋結果列表
            
        Returns:
            str: 格式化的文本結果
        """
        if not results:
            return "未找到相關的占星學知識。"
        
        # 過濾低相似度結果
        filtered_results = [
            result for result in results 
            if result.get("score", 0) >= self.similarity_threshold
        ]
        
        if not filtered_results:
            return f"未找到相似度超過{self.similarity_threshold}的相關知識。"
        
        formatted_text = "🔍 相關占星學知識：\n\n"
        
        for i, result in enumerate(filtered_results[:5], 1):  # 最多顯示5個結果
            score = result.get("score", 0)
            question = result.get("question", "")
            answer = result.get("answer", "")
            
            formatted_text += f"【知識點 {i}】(相似度: {score:.3f})\n"
            if question:
                formatted_text += f"問題：{question}\n"
            if answer:
                formatted_text += f"答案：{answer}\n"
            formatted_text += "\n"
        
        return formatted_text.strip()


# 創建全局RAG工具實例
_rag_tool_instance = AstrologyRAGTool()


@tool("search_astrology_knowledge")
def search_astrology_knowledge(query: str, top_k: int = 5) -> str:
    """
    搜尋占星學知識庫
    
    這個工具可以搜尋占星學理論知識庫，包括星座、行星、宮位、相位等相關知識。
    適用於回答占星學理論問題、概念解釋、基礎知識查詢等。
    
    Args:
        query (str): 搜尋查詢，例如："什麼是上升星座？"、"金星在第七宮的意義"
        top_k (int): 返回結果數量，默認5個
        
    Returns:
        str: 格式化的占星學知識內容
        
    Examples:
        - search_astrology_knowledge("上升星座的意義")
        - search_astrology_knowledge("水星逆行對生活的影響")
        - search_astrology_knowledge("第七宮代表什麼")
    """
    try:
        # 使用Pinecone客戶端搜尋
        results = _rag_tool_instance.client.search_rag_context(
            user_query=query,
            index_name="astrology-text",
            namespace="hierarchy_chunking_strategy",
            top_k=top_k
        )
        
        # 格式化結果
        return _rag_tool_instance.format_results(results)
        
    except Exception as e:
        return f"搜尋占星學知識時發生錯誤：{str(e)}"


@tool("search_astrology_knowledge_advanced")
def search_astrology_knowledge_advanced(
    query: str, 
    top_k: int = 5,
    similarity_threshold: float = 0.7
) -> str:
    """
    進階占星學知識搜尋
    
    提供更多控制選項的占星學知識庫搜尋工具。
    
    Args:
        query (str): 搜尋查詢
        top_k (int): 返回結果數量，默認5個
        similarity_threshold (float): 相似度閾值，默認0.7
        
    Returns:
        str: 格式化的占星學知識內容
    """
    try:
        # 臨時調整相似度閾值
        original_threshold = _rag_tool_instance.similarity_threshold
        _rag_tool_instance.similarity_threshold = similarity_threshold
        
        # 搜尋知識
        results = _rag_tool_instance.client.search_rag_context(
            user_query=query,
            index_name="astrology-text",
            namespace="hierarchy_chunking_strategy",
            top_k=top_k
        )
        
        # 格式化結果
        formatted_result = _rag_tool_instance.format_results(results)
        
        # 恢復原始閾值
        _rag_tool_instance.similarity_threshold = original_threshold
        
        return formatted_result
        
    except Exception as e:
        return f"進階搜尋占星學知識時發生錯誤：{str(e)}"


# 導出工具列表，供Agent使用
RAG_TOOLS = [
    search_astrology_knowledge,
    search_astrology_knowledge_advanced
]


def get_rag_tools() -> List:
    """
    獲取所有RAG工具
    
    Returns:
        List: RAG工具列表
    """
    return RAG_TOOLS


if __name__ == "__main__":
    # 測試RAG工具
    print("測試RAG工具...")
    
    test_queries = [
        "什麼是上升星座？",
        "金星在第七宮的意義",
        "水星逆行的影響"
    ]
    
    for query in test_queries:
        print(f"\n查詢：{query}")
        result = search_astrology_knowledge(query)
        print(f"結果：{result}")
        print("-" * 50)
