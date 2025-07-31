"""
GPT-4o client for Azure OpenAI integration.
Based on the existing llm_example.py patterns.
"""

import asyncio
from typing import AsyncGenerator, List, Dict, Optional
from fixed_openai_clients import AsyncAzureOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionChunk

from config import config


class GPT4oClient:
    """
    Client for GPT-4o model operations via Azure OpenAI.
    """

    def __init__(self):
        """Initialize GPT-4o client with Azure OpenAI configuration."""
        self.client = AsyncAzureOpenAI(
            api_key=config.AZURE_API_KEY,
            api_version="2025-01-01-preview",
            azure_endpoint="https://x7048-m50qpz5s-eastus2.cognitiveservices.azure.com/",
        )
        self.deployment_name = "gpt-4.1"

    def _format_messages(self, system_prompt: str, user_input: str, rag_context: List[Dict] = None) -> List[Dict]:
        """
        Format messages for GPT-4o with optional RAG context.
        
        Args:
            system_prompt (str): System prompt
            user_input (str): User input
            rag_context (List[Dict]): RAG context from vector search
            
        Returns:
            List[Dict]: Formatted messages for OpenAI API
        """
        messages = []
        
        # Enhanced system prompt with RAG context if available
        enhanced_system_prompt = system_prompt
        if rag_context:
            context_text = self._format_rag_context(rag_context)
            enhanced_system_prompt = f"{system_prompt}\n\n相關背景資訊：\n{context_text}"
        
        messages.append({
            "role": "system",
            "content": enhanced_system_prompt
        })
        
        messages.append({
            "role": "user",
            "content": user_input
        })
        
        return messages

    def _format_rag_context(self, rag_context: List[Dict]) -> str:
        """
        Format RAG context into readable text.
        
        Args:
            rag_context (List[Dict]): RAG context results
            
        Returns:
            str: Formatted context text
        """
        context_parts = []
        for i, context in enumerate(rag_context, 1):
            question = context.get("question", "")
            answer = context.get("answer", "")
            score = context.get("score", 0.0)
            
            if question and answer:
                context_parts.append(f"參考資料 {i} (相似度: {score:.3f}):\n問題: {question}\n答案: {answer}")
        
        return "\n\n".join(context_parts)

    async def generate_streaming_response(self, 
                                        system_prompt: str, 
                                        user_input: str, 
                                        rag_context: List[Dict] = None,
                                        temperature: float = 0.7,
                                        max_tokens: int = 4096) -> AsyncGenerator[str, None]:
        """
        Generate streaming response from GPT-4o with optional RAG context.
        
        Args:
            system_prompt (str): System prompt
            user_input (str): User input
            rag_context (List[Dict]): Optional RAG context
            temperature (float): Generation temperature
            max_tokens (int): Maximum tokens to generate
            
        Yields:
            str: Generated text chunks
        """
        try:
            messages = self._format_messages(system_prompt, user_input, rag_context)
            
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error generating response: {str(e)}"

    async def generate_response(self, 
                              system_prompt: str, 
                              user_input: str, 
                              rag_context: List[Dict] = None,
                              temperature: float = 0.7,
                              max_tokens: int = 4096) -> str:
        """
        Generate complete response from GPT-4o (non-streaming).
        
        Args:
            system_prompt (str): System prompt
            user_input (str): User input
            rag_context (List[Dict]): Optional RAG context
            temperature (float): Generation temperature
            max_tokens (int): Maximum tokens to generate
            
        Returns:
            str: Complete generated response
        """
        try:
            messages = self._format_messages(system_prompt, user_input, rag_context)
            
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def get_client_info(self) -> dict:
        """
        Get information about the GPT-4o client.

        Returns:
            dict: Client information
        """
        return {
            "endpoint": "https://x7048-m50qpz5s-eastus2.cognitiveservices.azure.com/",
            "deployment": self.deployment_name,
            "api_version": "2025-01-01-preview"
        }


# Global instance
gpt4o_client = None


def initialize_gpt4o_client() -> GPT4oClient:
    """
    Initialize the global GPT-4o client.
    
    Returns:
        GPT4oClient: Initialized client
    """
    global gpt4o_client
    if gpt4o_client is None:
        gpt4o_client = GPT4oClient()
    return gpt4o_client


def get_gpt4o_client() -> Optional[GPT4oClient]:
    """Get the global GPT-4o client instance."""
    return gpt4o_client
