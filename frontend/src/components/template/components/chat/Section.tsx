"use client";

import { cn } from "@/lib/utils";
import { Message } from "@/types/Message";
import { useState, useEffect } from "react";
import LoadingText from "@/components/loading/LoadingText";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { RightPanel, useRightPanel } from "@/components/chat/messageSection/RightPanel";
import LensInput from "../Input/LensInput";

interface ChatSectionProps {
  className?: string;
  chatHistory: Message[];
  currentChat: Message[];
  chatRef?: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  isStreaming: boolean;
  isToolPanel?: boolean;
  handleChat?: (query: string) => void;
  handleStopChat?: () => void;
  query?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editableTitle?: React.ReactNode;
}

export default function ChatSection({
  className,
  editableTitle,
  isToolPanel,
  chatRef,
  chatHistory,
  currentChat,
  isLoading,
  isStreaming,
  handleChat,
  handleStopChat,
  query,
  onChange,
}: ChatSectionProps) {
  const [expandedTools, setExpandedTools] = useState<{
    [key: string]: boolean;
  }>({});
  const { isOpen, toggle } = useRightPanel();
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [isMobileView, setIsMobileView] = useState(false);
  // 监听窗口大小变化
  useEffect(() => {
    const checkWindowSize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    // 初始检查
    checkWindowSize();

    // 监听resize事件
    window.addEventListener("resize", checkWindowSize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", checkWindowSize);
    };
  }, []);

  // 切换工具面板的展开状态
  const toggleToolExpansion = (toolId: string) => {
    setSelectedMessageId(toolId);
    setExpandedTools((prev) => {
      // 移动设备下的处理逻辑
      if (isMobileView) {
        const newValue = prev[toolId] === false ? true : false;
        // 如果要展开当前工具，则关闭其他所有工具
        if (newValue) {
          const result: { [key: string]: boolean } = {};
          // 设置所有工具为false（关闭状态）
          Object.keys(prev).forEach((key) => {
            result[key] = false;
          });
          // 只设置当前工具为true（打开状态）
          result[toolId] = true;
          return result;
        } else {
          // 如果是关闭操作，只修改当前工具的状态
          return {
            ...prev,
            [toolId]: false,
          };
        }
      } else {
        const newValue = prev[toolId] === false ? true : false;
        return {
          ...prev,
          [toolId]: newValue,
        };
      }
    });
  };

  return (
    <>
      {/* 聊天消息区域 */}
      <div
        ref={chatRef}
        className={cn(
          "custom-scrollbar h-screen relative flex flex-1 flex-col gap-3 overflow-y-auto p-0 transition-all duration-300",
          "px-2 sm:px-4 lg:px-4",
          isOpen && !isMobileView ? "w-3/5" : "w-full",
          className,
        )}
      >
        <header className={cn(
          "sticky top-0 z-10 flex shrink-0 bg-background items-center justify-between",
          "h-12 sm:h-10 px-2 sm:px-4"
        )}>
          <div className="flex w-full items-center pt-1">
            {editableTitle}
          </div>
          <div className="pointer-events-none absolute inset-0 top-0 z-[-1] h-12 bg-background bg-linear-to-b via-65% blur-xs" />
        </header>
        {chatHistory &&
          chatHistory.length > 0 &&
          chatHistory.map((message, index) => (
            <ChatMessage
              key={`history-${index}`}
              message={message}
              chatHistory={chatHistory}
              currentChat={currentChat}
              expandedTools={expandedTools}
              toggleSidePanel={toggle}
              toggleToolExpansion={toggleToolExpansion}
              handleChat={handleChat || ((query: string) => { })}
              isToolPanel={isToolPanel || false}
              isDisabled={isLoading || isStreaming}
              isMobileView={isMobileView}
            />
          ))}
        {currentChat &&
          currentChat.length > 0 &&
          currentChat.map((message, index) => (
            <ChatMessage
              key={`current-${index}`}
              message={message}
              chatHistory={chatHistory}
              currentChat={currentChat}
              expandedTools={expandedTools}
              toggleSidePanel={toggle}
              toggleToolExpansion={toggleToolExpansion}
              handleChat={handleChat || ((query: string) => { })}
              isToolPanel={isToolPanel || false}
              isDisabled={isLoading || isStreaming}
              isMobileView={isMobileView}
            />
          ))}
        {(isLoading || isStreaming) && (
          <div className="flex items-center justify-start">
            <LoadingText className="size-6" />
          </div>
        )}
        <div className={cn(
          "w-full sticky bottom-0 mt-auto bg-background left-0",
          "pb-3 sm:pb-4 pt-2 sm:pt-0"
        )}>
          <LensInput
            isChatLoading={isLoading}
            isStreaming={isStreaming}
            handleStopChat={handleStopChat || (() => { })}
            handleChatLens={handleChat || (() => { })}
            query={query || ""}
            onChange={onChange || (() => { })}
            className="w-full"
          />
        </div>
      </div>
      {/* 右侧面板 - 独立于滚动区域 */}
      {isToolPanel && !isMobileView && (
        <RightPanel
          isOpen={isOpen}
          onOpenChange={toggle}
          className="custom-scrollbar py-4"
          width="w-2/5"
          chatHistory={chatHistory}
          currentChat={currentChat}
          selectedMessageId={selectedMessageId}
          setSelectedMessageId={setSelectedMessageId}
        />
      )}
    </>
  );
}
