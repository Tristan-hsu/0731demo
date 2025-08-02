import React, { useState } from 'react';
import LawCard from '@/components/card/LawCard';

interface LawSearchResult {
  article_content: string;
  article_title: string;
  last_modified: string;
  law_category: string;
  law_name: string;
  law_type: string;
  snippet: string;
  distance: number;
}

interface SearchLawsProps {
  results: string | object | LawSearchResult[];
}

const SearchLaws: React.FC<SearchLawsProps> = ({ results }) => {
  let laws: LawSearchResult[] = [];

  // 處理不同格式的輸入數據
  if (typeof results === "string") {
    try {
      const parsedResults = JSON.parse(results);
      laws = Array.isArray(parsedResults) ? parsedResults : [];
    } catch (error) {
      console.error("解析JSON字符串失敗:", error);
      laws = [];
    }
  } else if (Array.isArray(results)) {
    laws = results;
  } else if (typeof results === "object" && results !== null) {
    // 如果是對象，嘗試提取數組
    if ('results' in results && Array.isArray((results as any).results)) {
      laws = (results as any).results;
    } else if (Array.isArray(Object.values(results)[0])) {
      laws = Object.values(results)[0] as LawSearchResult[];
    } else {
      console.error("無法從對象中提取法律結果數組");
      laws = [];
    }
  }

  // 計算相似度百分比
  const getSimilarityPercentage = (distance: number) => {
    return Math.round((1 - distance) * 100);
  };

  // 如果沒有有效數據，顯示錯誤信息
  if (!laws) {
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
  if (laws.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-muted/50 border border-border rounded-lg">
          <div className="text-muted-foreground mb-2">🔍</div>
          <h3 className="text-base font-semibold text-foreground mb-2">未找到相關法規</h3>
          <p className="text-muted-foreground text-sm">
            根據您的搜尋條件，目前沒有找到相關的法律條文。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 custom-scrollbar">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">📚 法律檢索結果</h2>
        <p className="text-muted-foreground text-sm">找到 <span className="font-semibold text-primary">{laws.length}</span> 筆相關法規</p>
      </div>

      {laws.map((result, index) => (
        <LawCard key={index} result={result} index={index} />
      ))}

      {/* 底部統計 */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-xs">
            共檢索到 <span className="font-bold text-primary">{laws.length}</span> 筆住宅法相關條文，
            平均相似度為 <span className="font-bold text-chart-2">
              {Math.round(laws.reduce((acc, r) => acc + getSimilarityPercentage(r.distance), 0) / laws.length)}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchLaws;
