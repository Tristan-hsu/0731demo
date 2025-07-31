"""
Configuration management for the enhanced API server.
Loads environment variables and provides centralized configuration access.
"""

import os
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Centralized configuration management class."""
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
    AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    
    # Legacy Azure API Configuration (for backward compatibility)
    AZURE_API_END: str = os.getenv("AZURE_API_END", "")
    AZURE_API_KEY: str = os.getenv("AZURE_API_KEY", "")
    EMBED_KEY: str = os.getenv("EMBED_KEY", "")
    EMBED_END: str = os.getenv("EMBED_END", "")
    
    # Pinecone Configuration
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "3001"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # RAG Configuration
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "astrology-text")
    PINECONE_NAMESPACE: str = os.getenv("PINECONE_NAMESPACE", "hierarchy_chunking_strategy")
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))

    # Astrologer System Configuration
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    ASTROLOGER_CONFIG_PATH: str = os.getenv("ASTROLOGER_CONFIG_PATH", "astrology_mcp.json")
    ENABLE_RAG_FALLBACK: bool = os.getenv("ENABLE_RAG_FALLBACK", "true").lower() == "true"
    MIN_CONTEXT_CHUNKS: int = int(os.getenv("MIN_CONTEXT_CHUNKS", "1"))
    
    # Application Configuration
    RESPONSE_TIMEOUT: int = 3600  # 1 hour
    REQUEST_TIMEOUT: int = 3600   # 1 hour
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB
    SEND_FILE_MAX_AGE_DEFAULT: int = 3600  # 1 hour
    PERMANENT_SESSION_LIFETIME: int = 3600  # 1 hour
    
    # API Server 配置
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_DEBUG: bool = os.getenv("API_DEBUG", "False").lower() == "true"
    API_WORKERS: int = int(os.getenv("API_WORKERS", "1"))
    
    # CORS 配置
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_HEADERS: List[str] = ["*"]
    
    # AstroMCP 服務配置
    ASTROMCP_BASE_URL: str = os.getenv("ASTROMCP_BASE_URL", "http://localhost:3000")
    ASTROMCP_TIMEOUT: int = int(os.getenv("ASTROMCP_TIMEOUT", "30"))
    
    # AstroChart 配置
    CHART_IMAGE_PATH: str = os.getenv("CHART_IMAGE_PATH", "./chart/images")
    CHART_CACHE_PATH: str = os.getenv("CHART_CACHE_PATH", "./chart/cache")
    CHART_FORMAT: str = os.getenv("CHART_FORMAT", "svg")
    CHART_SERVICE_URL: str = os.getenv("CHART_SERVICE_URL", "http://localhost:3001")
    
    # ReAct Agent 配置
    AGENT_TEMPERATURE: float = float(os.getenv("AGENT_TEMPERATURE", "0.7"))
    AGENT_MAX_ITERATIONS: int = int(os.getenv("AGENT_MAX_ITERATIONS", "5"))
    AGENT_MAX_TOKENS: int = int(os.getenv("AGENT_MAX_TOKENS", "4096"))
    
    # 搜尋工具配置
    SEARCH_API_KEY: str = os.getenv("SEARCH_API_KEY", "")
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that required configuration values are present."""
        required_fields = [
            "AZURE_API_KEY",
            "EMBED_KEY"
        ]
        
        missing_fields = []
        for field in required_fields:
            if not getattr(cls, field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"Missing required configuration fields: {', '.join(missing_fields)}")
            return False
        
        return True
    
    @classmethod
    def get_azure_openai_config(cls) -> dict:
        """Get Azure OpenAI configuration as a dictionary."""
        return {
            "azure_endpoint": cls.AZURE_API_END,
            "api_key": cls.AZURE_API_KEY,
            "api_version": "2025-01-01-preview",
            "azure_deployment": "gpt-4.1"
        }
    
    @classmethod
    def get_pinecone_config(cls) -> dict:
        """Get Pinecone configuration as a dictionary."""
        return {
            "api_key": cls.PINECONE_API_KEY,
            "environment": cls.PINECONE_ENVIRONMENT,
            "index_name": cls.PINECONE_INDEX_NAME,
            "namespace": cls.PINECONE_NAMESPACE,
            "top_k": cls.RAG_TOP_K
        }

# Create a global config instance
config = Config()

# Validate configuration on import (but don't fail if missing for demo)
if not config.validate_config():
    print("Warning: Configuration validation failed. Please set up your .env file with proper API keys.")
