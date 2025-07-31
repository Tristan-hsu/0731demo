#!/usr/bin/env python3
"""
智能占星助手服務器啟動腳本
Intelligent Astrology Assistant Server Startup Script
"""

import os
import sys
import asyncio
import uvicorn
from pathlib import Path

# 添加當前目錄到Python路徑
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def check_environment():
    """檢查環境配置"""
    print("🔍 檢查環境配置...")
    
    # 檢查.env文件
    env_file = current_dir / ".env"
    if not env_file.exists():
        print("⚠️ 警告：未找到.env文件，請創建並配置API密鑰")
        return False
    
    # 檢查虛擬環境
    venv_path = current_dir / "venv"
    if not venv_path.exists():
        print("❌ 錯誤：未找到虛擬環境，請先運行 python -m venv venv")
        return False
    
    print("✅ 環境檢查通過")
    return True

def check_dependencies():
    """檢查依賴包"""
    print("📦 檢查依賴包...")
    
    required_packages = [
        "fastapi",
        "uvicorn", 
        "langchain",
        "langgraph",
        "pinecone",
        "openai"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ 缺少依賴包: {', '.join(missing_packages)}")
        print("請運行: pip install -r requirements.txt")
        return False
    
    print("✅ 依賴包檢查通過")
    return True

def test_imports():
    """測試模組導入"""
    print("🧪 測試模組導入...")
    
    try:
        from config import config
        from integrated_api import app
        print("✅ 核心模組導入成功")
        return True
    except Exception as e:
        print(f"❌ 模組導入失敗: {e}")
        return False

def start_server(host="0.0.0.0", port=8000, reload=False):
    """啟動FastAPI服務器"""
    print(f"🚀 啟動智能占星助手服務器...")
    print(f"📍 地址: http://{host}:{port}")
    print(f"🌐 前端界面: http://{host}:{port}/static/simple_astro_ui.html")
    print("按 Ctrl+C 停止服務器")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "integrated_api:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 服務器已停止")
    except Exception as e:
        print(f"❌ 服務器啟動失敗: {e}")

def main():
    """主函數"""
    print("=" * 60)
    print("🌟 智能占星助手 - 服務器啟動器")
    print("🔮 Intelligent Astrology Assistant Server")
    print("=" * 60)
    
    # 環境檢查
    if not check_environment():
        print("\n❌ 環境檢查失敗，請修復後重試")
        return
    
    # 依賴檢查
    if not check_dependencies():
        print("\n❌ 依賴檢查失敗，請安裝缺少的包")
        return
    
    # 導入測試
    if not test_imports():
        print("\n❌ 模組導入失敗，請檢查代碼")
        return
    
    print("\n✅ 所有檢查通過，準備啟動服務器...")
    print("\n📋 使用說明:")
    print("1. 服務器啟動後，打開瀏覽器訪問前端界面")
    print("2. 在.env文件中配置您的API密鑰")
    print("3. 使用快速問題或直接輸入問題開始對話")
    print("4. 系統會自動選擇合適的工具來回答您的問題")
    
    # 啟動服務器
    start_server(
        host="0.0.0.0",
        port=8000,
        reload=True  # 開發模式，自動重載
    )

if __name__ == "__main__":
    main()
