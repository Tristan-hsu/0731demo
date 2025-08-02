"use client";

import Image from "next/image";
import { useState, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`${className}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
              ? "border-primary text-primary bg-muted/30"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              } ${tab.disabled ? "opacity-50 cursor-not-allowed hover:text-muted-foreground hover:border-transparent" : ""
              }`}
          >
            {tab.label === '回答' && <Image src='/logo.svg' alt={tab.label} width={16} height={16} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTabContent}
      </div>
    </div>
  );
}