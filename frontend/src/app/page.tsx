import Image from "next/image";
import Galaxy from "@/components/Galaxy";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Galaxy Background */}
      <div className="fixed inset-0 z-0">
        <Galaxy 
          focal={[0.5, 0.5]}
          rotation={[1.0, 0.0]}
          starSpeed={0.3}
          density={0.8}
          hueShift={140}
          speed={0.8}
          mouseInteraction={true}
          glowIntensity={0.4}
          saturation={0.2}
          mouseRepulsion={true}
          repulsionStrength={1.5}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
          transparent={true}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-sm">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            <span className="text-xl font-bold text-white">AstroApp</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">功能</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">關於</a>
            <a 
              href="/chat" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              開始使用
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              探索你的
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                星座命運
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              使用先進的占星算法，為您提供個性化的星座分析和未來預測。
              發現星星為您準備的獨特故事。
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a 
              href="/chat"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all text-center"
            >
              開始聊天
            </a>
            <button className="border border-gray-400 text-gray-300 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all">
              了解更多
            </button>
          </div>

          {/* Floating Elements */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="absolute top-16 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-8 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-2000"></div>
            <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-3000"></div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="px-6 py-20 bg-black/40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16">
              強大功能
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-2xl">🌟</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">個人星盤</h3>
                <p className="text-gray-300">
                  根據您的出生時間和地點，生成詳細的個人星盤分析，
                  了解您的性格特質和天賦潛能。
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-2xl">🔮</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">運勢預測</h3>
                <p className="text-gray-300">
                  基於行星運行軌跡，為您預測未來的機遇和挑戰，
                  幫助您做出更明智的決策。
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">配對分析</h3>
                <p className="text-gray-300">
                  分析您與他人的星座兼容性，
                  發現最佳的友誼和愛情配對組合。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="text-lg font-semibold text-white">AstroApp</span>
            </div>
            <p className="text-gray-400 mb-8">
              讓星星指引您的人生旅程
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">隱私政策</a>
              <a href="#" className="hover:text-white transition-colors">服務條款</a>
              <a href="#" className="hover:text-white transition-colors">聯絡我們</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
