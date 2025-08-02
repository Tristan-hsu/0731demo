"""
修復後的 OpenAI 客戶端模組
自動處理 proxies 參數問題
"""

import httpx
from openai import AzureOpenAI as _AzureOpenAI, AsyncAzureOpenAI as _AsyncAzureOpenAI

# 全局修復：Monkey patch httpx.Client 和 httpx.AsyncClient
original_httpx_client_init = httpx.Client.__init__
original_httpx_async_client_init = httpx.AsyncClient.__init__

def patched_httpx_client_init(self, **kwargs):
    kwargs.pop('proxies', None)
    return original_httpx_client_init(self, **kwargs)

def patched_httpx_async_client_init(self, **kwargs):
    kwargs.pop('proxies', None)
    return original_httpx_async_client_init(self, **kwargs)

# 應用 monkey patch
httpx.Client.__init__ = patched_httpx_client_init
httpx.AsyncClient.__init__ = patched_httpx_async_client_init

class AzureOpenAI(_AzureOpenAI):
    """修復後的 AzureOpenAI 客戶端"""

    def __init__(self, **kwargs):
        # 移除可能導致問題的參數
        kwargs.pop('proxies', None)
        super().__init__(**kwargs)

class AsyncAzureOpenAI(_AsyncAzureOpenAI):
    """修復後的 AsyncAzureOpenAI 客戶端"""

    def __init__(self, **kwargs):
        # 移除可能導致問題的參數
        kwargs.pop('proxies', None)
        super().__init__(**kwargs)
