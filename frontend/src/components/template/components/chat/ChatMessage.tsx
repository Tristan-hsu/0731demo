import { cn } from "@/lib/utils";
import { Message } from "@/types/Message";
import { processContent } from "@/utils/text";
import { ArrowRight } from "lucide-react";
import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";
import { ToolUse } from "@/components/chat/messageSection/ToolUse";
import { ToolResult } from "./messageSection/ToolResult";

interface ChatMessageProps {
  message: Message;
  chatHistory: Message[];
  currentChat: Message[];
  expandedTools: { [key: string]: boolean };
  toggleToolExpansion: (toolId: string) => void;
  toggleSidePanel: () => void;
  handleChat: (query: string) => void;
  isToolPanel: boolean;
  isDisabled: boolean;
  isMobileView?: boolean;
}

export function ChatMessage({
  message,
  chatHistory,
  currentChat,
  expandedTools,
  toggleToolExpansion,
  toggleSidePanel,
  handleChat,
  isToolPanel,
  isDisabled,
  isMobileView = false,
}: ChatMessageProps) {
  const justifyClass = `flex gap-2 ${message.role === "human" ? "justify-end" : "justify-start w-full flex-col"
    }`;
  const markdownClass = `break-words rounded-[2px] px-[15px] py-[6px] text-sm leading-loose lg:text-base ${message.role === "human" ? "bg-white/30 max-w-4/5 text-white" : "text-white max-w-full"}`;


  if (message.type === "tool_use") {
    return (
      <ToolUse
        message={message}
        expandedTools={expandedTools}
        toggleToolExpansion={toggleToolExpansion}
        currentChat={currentChat}
        chatHistory={chatHistory}
        isToolPanel={isToolPanel}
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
    return (
      <div
        className={cn(
          justifyClass,
        )}
      >
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
