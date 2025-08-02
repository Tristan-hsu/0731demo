import { cn } from "@/lib/utils";
import { Message } from "@/types/Message";
import { processContent } from "@/utils/text";
import { ArrowRight } from "lucide-react";
import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";
import { ToolUse } from "@/components/chat/messageSection/ToolUse";
import { ToolResult } from "./messageSection/ToolResult";
import { Tabs } from "@/components/ui/tabs";
import { MobilePanelSelector, getPanelIcon } from "@/components/chat/MobilePanelSelector";
import { useState, useEffect } from "react";

interface ChatMessageTabProps {
  message: Message;
  chatHistory: Message[];
  currentChat: Message[];
  expandedTools: { [key: string]: boolean };
  toggleToolExpansion: (toolId: string) => void;
  toggleSidePanel: () => void;
  handleChat: (query: string) => void;
  isDisabled: boolean;
  isMobileView?: boolean;
}

export function ChatMessageTab({
  message,
  chatHistory,
  currentChat,
  expandedTools,
  toggleToolExpansion,
  handleChat,
  isDisabled,
  isMobileView = false,
}: ChatMessageTabProps) {
  const justifyClass = `flex gap-2 ${message.role === "human" ? "justify-end" : "justify-start w-full flex-col"
    }`;
  const markdownClass = `break-words rounded-[2px] px-[15px] py-[6px] text-sm leading-loose lg:text-base ${message.role === "human" ? "bg-white/30 max-w-4/5 text-white" : "text-white max-w-full"}`;

  // State for mobile panel
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to collect tool results
  const collectToolResults = (toolName: string) => {
    const results = [];

    // Collect from current chat
    for (const msg of currentChat) {
      if (msg.type === "tool_result" && msg.tool_name === toolName) {
        results.push(msg.tool_result);
      }
    }

    // Collect from chat history
    for (const msg of chatHistory) {
      if (msg.type === "tool_result" && msg.tool_name === toolName) {
        results.push(msg.tool_result);
      }
    }

    return results;
  };

  if (message.type === "tool_use") {
    return (
      <ToolUse
        message={message}
        expandedTools={expandedTools}
        toggleToolExpansion={toggleToolExpansion}
        currentChat={currentChat}
        chatHistory={chatHistory}
        isToolPanel={false}
        isMobileView={isMobileView}
      />
    );
  }
  if (message.type === "tool_result") {
    // 查找对应的工具使用消息
    let foundToolUse = false;

    // 首先在当前聊天记录中查找
    for (let i = 0; i < currentChat.length; i++) {
      const msg = currentChat[i];
      if (
        msg.type === "tool_use" &&
        msg.tool_name === message.tool_name &&
        msg.tool_id === message.tool_id
      ) {
        foundToolUse = true;
        break;
      }
    }

    // 如果在当前聊天中没找到，尝试在历史记录中查找
    if (!foundToolUse) {
      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        if (
          msg.type === "tool_use" &&
          msg.tool_name === message.tool_name &&
          msg.tool_id === message.tool_id
        ) {
          foundToolUse = true;
          break;
        }
      }
    }

    // 如果找不到对应的工具使用，则显示简单的结果消息
    if (!foundToolUse) {
      return (
        <div className={cn("flex w-full justify-start")}>
          <div className="max-w-[80%] rounded-[2px] bg-black/20 px-[15px] py-[6px] text-sm text-white/80">
            <div className="font-medium text-zinc-300">
              {message.tool_name} 結果：
            </div>
            <ToolResult
              toolName={message.tool_name || ""}
              toolArgs={{}}
              toolResult={message.tool_result}
            />
          </div>
        </div>
      );
    }

    // 如果找到了对应的工具使用，则在渲染工具使用消息时已经处理过，这里不需要渲染
    return null;
  }
  if (message.type === "choose_agent") {
    return (
      <div className={cn(justifyClass)}>
        <div>{message.content}</div>
      </div>
    );
  } else {
    // For AI assistant messages, use tabs interface or mobile panel
    if (message.role === "ai") {
      const lawResults = collectToolResults("search_laws");
      const caseResults = collectToolResults("search_cases");

      const answerContent = (
        <div>
          <ReactMarkdownCustom className="break-words text-sm leading-loose lg:text-base text-white">
            {processContent(message.content, message.sources)}
          </ReactMarkdownCustom>
          {message.prompts && message.prompts.length > 0 && (
            <div className="max-w-full overflow-hidden rounded-md border border-zinc-700 p-2 mt-4">
              <div className="divide-y divide-zinc-700/50 px-3 py-2">
                {message.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    onClick={isDisabled ? () => { } : () => handleChat(prompt)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 py-2 text-sm text-white/80 transition-all duration-200 first:pt-0 last:pb-0 lg:text-base",
                      "transition-all duration-300",
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:text-white",
                    )}
                  >
                    {prompt}
                    <ArrowRight className="size-4 text-white/80 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      const lawsContent = (
        <div className="space-y-4">
          {lawResults.length > 0 ? (
            lawResults.map((result, index) => (
              <div key={index} className="border border-zinc-700 rounded-md p-4">
                <ToolResult
                  toolName="search_laws"
                  toolArgs={{}}
                  toolResult={result}
                />
              </div>
            ))
          ) : (
            <div className="text-zinc-400 text-sm">未找到相關法條</div>
          )}
        </div>
      );

      const casesContent = (
        <div className="space-y-4">
          {caseResults.length > 0 ? (
            caseResults.map((result, index) => (
              <div key={index} className="border border-zinc-700 rounded-md p-4">
                <ToolResult
                  toolName="search_cases"
                  toolArgs={{}}
                  toolResult={result}
                />
              </div>
            ))
          ) : (
            <div className="text-zinc-400 text-sm">未找到相關案例</div>
          )}
        </div>
      );


      // Mobile view with panel selector
      if (isMobile) {
        const panels = [
          {
            id: "answer",
            label: "回答",
            icon: getPanelIcon("answer"),
            content: answerContent
          },
          {
            id: "laws",
            label: "法條",
            icon: getPanelIcon("laws"),
            content: lawsContent
          },
          {
            id: "cases",
            label: "案例",
            icon: getPanelIcon("cases"),
            content: casesContent
          },
        ];

        return (
          <div className={cn(justifyClass)}>
            <div className="max-w-full">
              {/* Main answer content always visible */}
              <div className="bg-black/20 rounded-lg p-4 mb-2">
                {answerContent}
              </div>

              {/* Mobile panel trigger button */}
              <button
                onClick={() => setShowMobilePanel(true)}
                className="w-full p-3 bg-black/20 rounded-lg flex items-center justify-center gap-2 text-sm text-white/80 hover:text-white hover:bg-black/30 transition-all"
              >
                查看更多內容
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Mobile panel selector */}
              {showMobilePanel && (
                <MobilePanelSelector
                  panels={panels}
                  defaultPanel="laws"
                  onClose={() => setShowMobilePanel(false)}
                />
              )}
            </div>
          </div>
        );
      }

      // Desktop view with tabs
      const tabs = [
        {
          id: "answer",
          label: "回答",
          content: answerContent
        },
        {
          id: "laws",
          label: "法條",
          content: lawsContent
        },
        {
          id: "cases",
          label: "案例",
          content: casesContent
        },
      ];

      return (
        <div className={cn(justifyClass)}>
          <div className="max-w-full">
            <Tabs
              tabs={tabs}
              defaultTab="answer"
              className="bg-black/20 rounded-lg p-4"
            />
          </div>
        </div>
      );
    } else {
      // For human messages, use original rendering
      return (
        <div className={cn(justifyClass)}>
          <ReactMarkdownCustom className={markdownClass}>
            {processContent(message.content, message.sources)}
          </ReactMarkdownCustom>
          {message.prompts && message.prompts.length > 0 && (
            <div className="max-w-full overflow-hidden rounded-md border border-zinc-700 p-2">
              <div className="divide-y divide-zinc-700/50 px-3 py-2">
                {message.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    onClick={isDisabled ? () => { } : () => handleChat(prompt)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 py-2 text-sm text-white/80 transition-all duration-200 first:pt-0 last:pb-0 lg:text-base",
                      "transition-all duration-300",
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:text-white",
                    )}
                  >
                    {prompt}
                    <ArrowRight className="size-4 text-white/80 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  }
}
