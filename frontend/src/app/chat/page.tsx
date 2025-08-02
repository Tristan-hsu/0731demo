"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types/Message";
import Image from "next/image";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const { currentChat, handleChat, isChatLoading, isStreaming } = useChat({
    setQuery,
    chatContainerRef,
    apiPath: "/chat/stream", // 您需要實現此 API 端點
    extraParams: {},
  });

  // 模擬星盤數據
  const [astroChart, setAstroChart] = useState({
    imageUrl: "/charts/123_natal_chart.svg",
    interpretation: "您的星盤顯示出強烈的創造力和直覺能力。太陽在雙子座表明您善於溝通，而月亮在天蠍座則賦予您深刻的洞察力。火星在獅子座位置強化了您的領導才能..."
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage("");
    await handleChat(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 自動滾動到底部
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [currentChat]);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "human";
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-2xl  ${
            isUser
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-gray-800 text-gray-100 border border-gray-700"
          }`}
        >
          {message.content && (
          <div className="whitespace-pre-wrap break-words px-4 py-3">
            {message.content}
          </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* 左側聊天區域 */}
      <div className="flex-1 flex flex-col">
        {/* 聊天標題 */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="text-2xl mr-2">🔮</span>
                占星師 AI 助手
              </h1>
              <p className="text-gray-300 text-sm mt-1">
                問我任何關於占星、星盤或人生指導的問題
              </p>
            </div>
            <a 
              href="/"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="text-sm">返回首頁</span>
            </a>
          </div>
        </div>

        {/* 聊天消息區域 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {currentChat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                歡迎來到占星聊天室
              </h3>
              <p className="text-gray-300 max-w-md">
                我是您的專屬占星師 AI。您可以問我關於星座、運勢、
                性格分析或任何占星相關的問題。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-md">
                <button
                  onClick={() => setInputMessage("分析我的星盤特質")}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  分析我的星盤特質
                </button>
                <button
                  onClick={() => setInputMessage("今日運勢如何？")}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  今日運勢如何？
                </button>
                <button
                  onClick={() => setInputMessage("我的愛情運怎麼樣？")}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  我的愛情運怎麼樣？
                </button>
                <button
                  onClick={() => setInputMessage("解釋一下我的月亮星座")}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  解釋一下我的月亮星座
                </button>
              </div>
            </div>
          ) : (
            currentChat.map((message, index) => renderMessage(message, index))
          )}
          
          {isChatLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-gray-400 text-sm">AI 正在思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 輸入區域 */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-gray-700 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入您的問題..."
                className="w-full bg-gray-800 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-32"
                rows={1}
                disabled={isChatLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isChatLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-2xl transition-all disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 右側星盤面板 */}
      <div className="w-96 bg-black/30 backdrop-blur-sm border-l border-gray-700 flex flex-col">
        {/* 面板標題 */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <span className="text-lg mr-2">🌟</span>
            您的星盤
          </h2>
        </div>
        {/* 星盤圖片 */}
        <div className="p-4">
         <Image src={'/charts/123_natal_chart.svg'} className="w-full h-full" alt="星盤圖片" width={1980} height={1980} />
        </div>

        {/* 星盤解釋 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-md font-semibold text-white mb-3">
            星盤資料
          </h3>
          <div className="bg-gray-800/50 rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
            {astroChart.interpretation}
          </div>
          
          {/* 重要位置 */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2">
              重要星體位置
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-gray-800/30 rounded-lg p-2">
                <span className="text-gray-300">太陽 ☉</span>
                <span className="text-yellow-400">雙子座 15°</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded-lg p-2">
                <span className="text-gray-300">月亮 ☽</span>
                <span className="text-gray-300">天蠍座 8°</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded-lg p-2">
                <span className="text-gray-300">上升</span>
                <span className="text-purple-400">處女座 22°</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800/30 rounded-lg p-2">
                <span className="text-gray-300">金星 ♀</span>
                <span className="text-green-400">巨蟹座 3°</span>
              </div>
            </div>
          </div>

          {/* 生成新星盤按鈕 */}
          <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg transition-all text-sm">
            生成新星盤
          </button>
        </div>
      </div>
    </div>
  );
}
