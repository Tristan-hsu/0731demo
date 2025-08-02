import React, { useState } from 'react';
import { FileText, Target, ChevronDown, ChevronRight } from "lucide-react";

interface CaseSearchResult {
  case_title: string;
  chunk_text: string;
  chunk_type: string;
  line_idx: number;
  distance: number;
}

interface SearchCasesProps {
  results: string | object | CaseSearchResult[];
}

const SearchCases: React.FC<SearchCasesProps> = ({ results }) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  let cases: CaseSearchResult[] = [];

  // 處理不同格式的輸入數據
  if (typeof results === "string") {
    try {
      const parsedResults = JSON.parse(results);
      cases = Array.isArray(parsedResults) ? parsedResults : [];
    } catch (error) {
      console.error("解析JSON字符串失敗:", error);
      cases = [];
    }
  } else if (Array.isArray(results)) {
    cases = results;
  } else if (typeof results === "object" && results !== null) {
    // 如果是對象，嘗試提取數組
    if ('results' in results && Array.isArray((results as any).results)) {
      cases = (results as any).results;
    } else if (Array.isArray(Object.values(results)[0])) {
      cases = Object.values(results)[0] as CaseSearchResult[];
    } else {
      console.error("無法從對象中提取案例結果數組");
      cases = [];
    }
  }

  // 取得案件類型標籤
  const getChunkTypeLabel = (type: string) => {
    switch (type) {
      case 'sentence':
        return '判決內容';
      case 'summary':
        return '案件摘要';
      case 'reasoning':
        return '判決理由';
      default:
        return type;
    }
  };

  // 計算相似度百分比
  const getSimilarityPercentage = (distance: number) => {
    return Math.round((1 - distance) * 100);
  };

  // 獲取相似度顏色
  const getSimilarityColor = (percentage: number) => {
    if (percentage >= 80) return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    if (percentage >= 60) return "bg-primary/10 text-primary border-primary/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  // 切換卡片展開狀態
  const toggleCardExpand = (index: number) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(index)) {
      newExpandedCards.delete(index);
    } else {
      newExpandedCards.add(index);
    }
    setExpandedCards(newExpandedCards);
  };

  // 格式化案件標題，提取法院和案號
  const formatCaseTitle = (title: string) => {
    const parts = title.split(' ');
    const court = parts.slice(0, -1).join(' ');
    const caseNumber = parts[parts.length - 1];
    return { court, caseNumber };
  };

  // 如果沒有有效數據，顯示錯誤信息
  if (!cases) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">⚠️</div>
          <h3 className="text-base font-semibold text-foreground mb-2">無法加載檢索結果</h3>
          <p className="text-muted-foreground text-sm">
            請檢查輸入的數據格式是否正確，或稍後再試。
          </p>
        </div>
      </div>
    );
  }
  if (cases.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">🔍</div>
          <h3 className="text-base font-semibold text-foreground mb-2">未找到相關案例</h3>
          <p className="text-muted-foreground text-sm">
            根據您的搜尋條件，目前沒有找到相關的法律案例。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 custom-scrollbar">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">⚖️ 案例檢索結果</h2>
        <p className="text-muted-foreground text-sm">找到 <span className="font-semibold text-primary">{cases.length}</span> 筆相關案例</p>
      </div>

      {cases.map((result, index) => {
        const similarityPercentage = getSimilarityPercentage(result.distance);
        const isExpanded = expandedCards.has(index);
        const { court, caseNumber } = formatCaseTitle(result.case_title);

        return (
          <div key={index} className="bg-secondary/30 rounded-lg border border-border hover:shadow-md transition-shadow duration-300 border-l-4 border-l-primary overflow-hidden">
            {/* 標題區域 - 可點擊 */}
            <div
              className="p-4 pb-3 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors duration-200"
              onClick={() => toggleCardExpand(index)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex gap-2 items-center min-w-0">
                    <FileText className="size-4 text-primary flex-shrink-0" />
                    <h3 className="text-lg font-bold text-card-foreground truncate">
                      {court}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getSimilarityColor(similarityPercentage)}`}>
                    <Target className="h-3 w-3" />
                    {similarityPercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* 內容區域 - 帶動畫效果 */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'
              }`}>
              <div className="p-4 space-y-4">
                {/* 元數據 */}
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span className="font-medium">內容類型：</span>
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                      {getChunkTypeLabel(result.chunk_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">段落位置：</span>
                    <span>第 {result.line_idx + 1} 段</span>
                  </div>
                </div>

                {/* 判決內容 */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-card-foreground mb-3 pb-2 border-b border-border flex items-center gap-2 text-sm">
                    📄 相關內容
                  </h4>
                  <div className="text-card-foreground/90 text-sm leading-relaxed">
                    {result.chunk_text}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 底部統計 */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">
            共檢索到 <span className="font-bold text-primary">{cases.length}</span> 筆相關案例，
            平均相似度為 <span className="font-bold text-chart-2">
              {Math.round(cases.reduce((acc, r) => acc + getSimilarityPercentage(r.distance), 0) / cases.length)}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchCases;
