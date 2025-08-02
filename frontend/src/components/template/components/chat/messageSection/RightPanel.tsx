"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Loader2, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types/Message";
import { FaSafari } from "react-icons/fa";
import { ToolResult } from "./ToolResult";

// 根据action类型返回对应的中文提示文本
export function getActionText(action?: string): string {
  if (!action) return "處理中";

  switch (action) {
    case "web_search":
      return "正在搜尋";
    case "go_to_url":
      return "正在前往";
    case "scroll_down":
      return "向下滾動";
    default:
      return "處理中";
  }
}

interface RightPanelProps {
  className?: string;
  width?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  chatHistory?: Message[];
  currentChat?: Message[];
  selectedMessageId: string;
  setSelectedMessageId: (id: string) => void;
}

export function RightPanel({
  className,
  width = "w-80",
  isOpen,
  onOpenChange,
  chatHistory,
  currentChat,
  selectedMessageId,
  setSelectedMessageId,
}: RightPanelProps) {
  const [internalOpen, setInternalOpen] = useState(isOpen || false);
  // 添加一个ref来跟踪是否是第一次看到lastToolUseMessage
  const seenLastToolUseMessageRef = useRef(false);

  // 确保内部状态与外部控制同步
  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  // 使用受控或非受控状态
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // 查找选中的工具使用消息
  const selectedMessage = useMemo(() => {
    // 先在当前聊天中查找
    const currentToolMessages = currentChat?.filter(
      (message) => message.type === "tool_use",
    );
    let found = currentToolMessages?.find(
      (message) =>
        `tool-${message.tool_name}-${message.tool_id}` === selectedMessageId,
    );
    
    // 如果在当前聊天中没找到，再在历史记录中查找
    if (!found && chatHistory) {
      const historyToolMessages = chatHistory.filter(
        (message) => message.type === "tool_use",
      );
      found = historyToolMessages.find(
        (message) =>
          `tool-${message.tool_name}-${message.tool_id}` === selectedMessageId,
      );
    }
    
    return found;
  }, [currentChat, chatHistory, selectedMessageId]);

  // 查找最后一条工具使用消息（当没有选中消息时使用）
  const lastToolUseMessage = useMemo(() => {
    if (!currentChat || currentChat.length === 0) {
      if (chatHistory && chatHistory.length > 0) {
        return [...chatHistory].reverse().find((msg) => msg.type === "tool_use");
      }
      return null;
    }
    return [...currentChat].reverse().find((msg) => msg.type === "tool_use");
  }, [currentChat]);

  // 自动打开面板，如果有selectedMessage或第一次发现lastToolUseMessage
  useEffect(() => {
    // 如果有selectedMessage，打开面板
    if (selectedMessage && !open) {
      setOpen(true);
      return;
    }

    // 如果有lastToolUseMessage且是第一次看到它，打开面板
    if (lastToolUseMessage && !seenLastToolUseMessageRef.current) {
      seenLastToolUseMessageRef.current = true;
      if (!open) {
        setOpen(true);
      }
    }
  }, [selectedMessage, lastToolUseMessage, open, setOpen]);

  // 查找匹配的工具结果消息（针对选中的消息）
  const resultMessage = useMemo(() => {
    if (!selectedMessage) return null;

    // 首先在当前聊天记录中查找
    let result = currentChat?.find(
      (msg) =>
        msg.type === "tool_result" &&
        msg.tool_name === selectedMessage.tool_name &&
        msg.tool_id === selectedMessage.tool_id,
    );

    // 如果在当前聊天中没找到，尝试在历史记录中查找
    if (!result && chatHistory) {
      result = chatHistory.find(
        (msg) =>
          msg.type === "tool_result" &&
          msg.tool_name === selectedMessage.tool_name &&
          msg.tool_id === selectedMessage.tool_id,
      );
    }

    return result;
  }, [selectedMessage, currentChat, chatHistory]);

  // 查找最后一条工具结果消息（当没有选中消息时使用）
  const lastResultMessage = useMemo(() => {
    if (!lastToolUseMessage) return null;

    // 首先在当前聊天记录中查找
    let result = currentChat?.find(
      (msg) =>
        msg.type === "tool_result" &&
        msg.tool_name === lastToolUseMessage.tool_name &&
        msg.tool_id === lastToolUseMessage.tool_id,
    );

    // 如果在当前聊天中没找到，尝试在历史记录中查找
    if (!result && chatHistory) {
      result = chatHistory.find(
        (msg) =>
          msg.type === "tool_result" &&
          msg.tool_name === lastToolUseMessage.tool_name &&
          msg.tool_id === lastToolUseMessage.tool_id,
      );
    }

    return result;
  }, [lastToolUseMessage, currentChat, chatHistory]);
  // 内嵌模式 - 作为固定侧边栏
  return (
    <div
      className={cn(
        "h-full overflow-hidden transition-all duration-300",
        open ? width : "w-0",
        className,
      )}
    >
      {open && (
        <div className="relative h-full w-full">
          <button
            onClick={() => {
              setOpen(false);
              setSelectedMessageId("");
            }}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 hover:opacity-100 focus:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-full overflow-y-auto p-4 rounded-md bg-card">
            <h2 className="mb-2 text-xl font-bold">Law Agent</h2>
            <div className="flex flex-col items-center justify-center space-y-4 px-2 text-center">
              <div className="flex w-full items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-sm bg-white/10 p-1">
                  <Scale className="size-8 text-primary" />
                </div>
                {selectedMessage ? (
                  <div className="flex flex-col items-start justify-center">
                    <p className="text-base text-zinc-500 dark:text-zinc-400">
                      Law Agent 正在使用
                      <span className="inline-block pl-2 font-bold">
                        {selectedMessage?.tool_name}
                      </span>
                    </p>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {JSON.stringify(selectedMessage.tool_args)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-start justify-center">
                    <p className="text-base text-zinc-500">
                      Law Agent 正在使用
                      <span className="inline-block pl-2 font-bold">
                        {lastToolUseMessage?.tool_name}
                      </span>
                    </p>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {JSON.stringify(lastToolUseMessage?.tool_args)}
                    </span>
                  </div>
                )}
              </div>
              {selectedMessage ? (
                <>
                  {/* 显示工具结果 */}
                  {resultMessage && resultMessage.type === "tool_result" ? (
                    <div className="w-full rounded-md">
                      <ToolResult
                        toolName={selectedMessage.tool_name}
                        toolArgs={selectedMessage.tool_args}
                        toolResult={(resultMessage as any).tool_result}
                      />
                    </div>
                  ) : (
                    <div className="w-full rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <Loader2 className="size-4 animate-spin text-zinc-500" />
                      </div>
                      <div className="mt-2 flex items-center justify-center rounded-md bg-black/60 p-4 dark:bg-zinc-800">
                        <p className="text-sm text-zinc-500">
                          處理中...
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 显示最后一条工具的结果 */}
                  {lastToolUseMessage &&
                    lastResultMessage &&
                    lastResultMessage.type === "tool_result" && (
                      <div className="w-full rounded-md">
                        <ToolResult
                          toolName={lastToolUseMessage.tool_name}
                          toolArgs={
                            lastToolUseMessage.tool_args
                          }
                          toolResult={(lastResultMessage as any).tool_result}
                        />
                      </div>
                    )}

                  {/* 如果有最后一条工具，但没有对应结果，显示加载中 */}
                  {lastToolUseMessage && !lastResultMessage && (
                    <div className="w-full rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-400">
                          {lastToolUseMessage.tool_name}
                        </p>
                        <Loader2 className="size-4 animate-spin text-zinc-500" />
                      </div>
                      <div className="mt-2 flex items-center justify-center rounded-md bg-black/60 p-4 dark:bg-zinc-800">
                        <p className="text-sm text-zinc-500">
                          處理中...
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 导出一个简单的控制函数
export function useRightPanel(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle, setIsOpen };
}
