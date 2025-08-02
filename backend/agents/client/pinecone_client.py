"""
Pinecone client for vector database operations.
Enhanced version based on the existing pinecone_example.py with RAG functionality.
"""

import os
import asyncio
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
import json

from .fixed.fixed_openai_clients import AzureOpenAI, AsyncAzureOpenAI
from pinecone import Pinecone

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from config import config


class PineconeClient:
    """
    Enhanced Pinecone client for vector database operations and RAG functionality.
    """

    def __init__(self):
        # Initialize Azure OpenAI client for embeddings (using legacy config)
        self._embed_client = AzureOpenAI(
            api_key=config.EMBED_KEY,
            api_version="2023-05-15",
            azure_endpoint="https://fluxmind.openai.azure.com/",
        )

        # Initialize async Azure OpenAI client for async operations
        self._async_embed_client = AsyncAzureOpenAI(
            api_key=config.EMBED_KEY,
            api_version="2023-05-15",
            azure_endpoint="https://fluxmind.openai.azure.com/",
        )

        # Initialize Pinecone connections (with error handling for test keys)
        self._pc = None
        self._pinecone_available = False

        if config.PINECONE_API_KEY and config.PINECONE_API_KEY != "test_key_placeholder":
            try:
                self._pc = Pinecone(api_key=config.PINECONE_API_KEY)
                self._pinecone_available = True
            except Exception as e:
                print(f"Warning: Pinecone initialization failed: {e}")
                self._pinecone_available = False
        else:
            print("Warning: Pinecone API key not configured, RAG functionality disabled")

    def embedder(self, query: str) -> List[float]:
        """
        Generate embeddings using Azure OpenAI.

        Args:
            query (str): Text to embed

        Returns:
            List[float]: Embedding vector
        """
        response = self._embed_client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
            dimensions=512  # 匹配Pinecone索引維度
        )
        return response.data[0].embedding

    async def async_embedder(self, query: str) -> List[float]:
        """
        Generate embeddings using Azure OpenAI (async version).

        Args:
            query (str): Text to embed

        Returns:
            List[float]: Embedding vector
        """
        response = await self._async_embed_client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
            dimensions=512  # 匹配Pinecone索引維度
        )
        return response.data[0].embedding

    def check_existing_ids(self, index_name: str, namespace: str, ids: List[str]) -> set:
        """Check if vector IDs already exist in Pinecone index."""
        try:
            index = self._pc.Index(index_name, pool_threads=50)
            existing_vectors = index.fetch(ids=ids, namespace=namespace)
            return set(existing_vectors.vectors.keys())
        except Exception as e:
            print(f"Error checking existing IDs: {str(e)}")
            return set()

    def upsert_vectors(self, index_name: str, namespace: str, embedded_data: List[Dict]) -> None:
        """
        Batch upload vectors to Pinecone.
        
        Args:
            index_name (str): Pinecone index name
            namespace (str): Pinecone namespace
            embedded_data (List[Dict]): Data to upload, each dict contains id, metadata, and value
        """
        index = self._pc.Index(index_name, pool_threads=50)
        
        if not embedded_data:
            return
            
        vectors = []
        for data in embedded_data:
            # Generate embedding if value is provided as string
            if isinstance(data.get("value"), str):
                vector = self.embedder(data["value"])
            else:
                vector = data.get("values", [])
                
            vectors.append({
                "id": data["id"],
                "values": vector,
                "metadata": data["metadata"]
            })
            
        if vectors:
            try:
                index.upsert(vectors=vectors, namespace=namespace)
                print(f"Successfully uploaded {len(vectors)} vectors to {index_name}/{namespace}")
            except Exception as e:
                print(f"Error uploading vectors: {str(e)}")

    def query_vectors(self,
                     query: str,
                     index_name: str = None,
                     namespace: str = None,
                     metadata_filter: dict = None,
                     top_k: int = None) -> List[Dict]:
        """
        Query Pinecone index for similar vectors.

        Args:
            query (str): Query text
            index_name (str): Index name (defaults to config value)
            namespace (str): Namespace (defaults to config value)
            metadata_filter (dict): Metadata filter conditions
            top_k (int): Number of results to return (defaults to config value)

        Returns:
            List[Dict]: Search results
        """
        if not self._pinecone_available:
            return []

        index_name = index_name or config.PINECONE_INDEX_NAME
        namespace = namespace or config.PINECONE_NAMESPACE
        top_k = top_k or config.RAG_TOP_K
        metadata_filter = metadata_filter or {}

        index = self._pc.Index(index_name, pool_threads=50)

        if query:
            vector = self.embedder(query)
        else:
            vector = [0] * 512  # Default embedding dimension (匹配Pinecone索引)

        results = index.query(
            namespace=namespace,
            vector=vector,
            top_k=top_k,
            filter=metadata_filter,
            include_values=False,
            include_metadata=True,
        )

        return results["matches"]

    async def query_vectors_async(self,
                                 query: str,
                                 index_name: str = None,
                                 namespace: str = None,
                                 metadata_filter: dict = None,
                                 top_k: int = None) -> List[Dict]:
        """
        Asynchronous version of query_vectors.
        """
        index_name = index_name or config.PINECONE_INDEX_NAME
        namespace = namespace or config.PINECONE_NAMESPACE
        top_k = top_k or config.RAG_TOP_K
        metadata_filter = metadata_filter or {}

        index = self._pc.Index(index_name, pool_threads=50)

        if query:
            vector = await self.async_embedder(query)
        else:
            vector = [0] * 512  # Default embedding dimension (匹配Pinecone索引)

        # Run the query in a thread pool since Pinecone client is sync
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            results = await loop.run_in_executor(
                executor,
                lambda: index.query(
                    namespace=namespace,
                    vector=vector,
                    top_k=top_k,
                    filter=metadata_filter,
                    include_values=False,
                    include_metadata=True,
                )
            )

        return results["matches"]

    def search_rag_context(self,
                          user_query: str,
                          index_name: str = None,
                          namespace: str = None,
                          top_k: int = None) -> List[Dict]:
        """
        Search for RAG context based on user query.

        Args:
            user_query (str): User's question
            index_name (str): Index name (defaults to config value)
            namespace (str): Namespace (defaults to config value)
            top_k (int): Number of results to return (defaults to config value)

        Returns:
            List[Dict]: Relevant context from vector database
        """
        if not self._pinecone_available:
            print("Warning: Pinecone not available, returning empty RAG context")
            return []

        try:
            matches = self.query_vectors(
                query=user_query,
                index_name=index_name,
                namespace=namespace,
                top_k=top_k
            )

            # Format results for RAG context
            context_results = []
            for match in matches:
                context_results.append({
                    "score": match.get("score", 0.0),
                    "question": match["metadata"].get("question", ""),
                    "answer": match["metadata"].get("answer", ""),
                    "metadata": match["metadata"]
                })

            return context_results

        except Exception as e:
            print(f"Error searching RAG context: {str(e)}")
            return []

    async def search_rag_context_async(self,
                                      user_query: str,
                                      index_name: str = None,
                                      namespace: str = None,
                                      top_k: int = None) -> List[Dict]:
        """
        Asynchronous version of search_rag_context.
        """
        if not self._pinecone_available:
            print("Warning: Pinecone not available, returning empty RAG context")
            return []

        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor,
                self.search_rag_context,
                user_query, index_name, namespace, top_k
            )
        return result
