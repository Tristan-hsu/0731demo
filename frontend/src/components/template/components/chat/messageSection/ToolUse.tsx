import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Message, ToolUseMessage } from "@/types/Message";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolResult } from "./ToolResult";

interface ToolUseProps {
  message: ToolUseMessage;
  expandedTools: { [key: string]: boolean };
  toggleToolExpansion: (toolId: string) => void;
  currentChat: Message[];
  chatHistory: Message[];
  isToolPanel: boolean;
  isMobileView?: boolean;
}

export function ToolUse({
  message,
  toggleToolExpansion,
  expandedTools,
  currentChat,
  chatHistory,
  isToolPanel,
  isMobileView = false,
}: ToolUseProps) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  // 为每个工具使用创建一个唯一ID
  const toolId = `tool-${message.tool_name}-${message.tool_id}`;

  // 根据移动视图设置默认展开状态
  // 在移动视图下，默认为关闭状态；在桌面视图下，保持原有逻辑
  const isExpanded = isMobileView
    ? expandedTools[toolId] === true
    : expandedTools[toolId] === false
      ? false
      : true;

  // 查找匹配的工具结果
  let resultMessage = null;

  // 首先在当前聊天记录中查找
  for (let i = 0; i < currentChat.length; i++) {
    const msg = currentChat[i];
    if (
      msg.type === "tool_result" &&
      msg.tool_name === message.tool_name &&
      msg.tool_id === message.tool_id
    ) {
      resultMessage = msg;
      break;
    }
  }

  // 如果在当前聊天中没找到，尝试在历史记录中查找
  if (!resultMessage) {
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i];
      if (
        msg.type === "tool_result" &&
        msg.tool_name === message.tool_name &&
        msg.tool_id === message.tool_id
      ) {
        resultMessage = msg;
        break;
      }
    }
  }

  return (
    <div className={cn("flex w-full justify-start")}>
      <div
        className={cn(
          "w-full max-w-full transform overflow-hidden rounded-[2px] bg-transparent text-white transition-all duration-500 ease-out",
          isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0",
        )}
      >
        <div
          className="flex w-fit cursor-pointer items-center justify-start gap-2 bg-primary/20 px-3 py-2 transition-colors hover:bg-primary/30"
          onClick={() => toggleToolExpansion(toolId)}
        >
          <ChevronRight
            size={16}
            className={cn(
              "text-zinc-400 transition-transform duration-200",
              isExpanded && !isToolPanel ? "rotate-90" : "",
            )}
          />
          <span className="text-sm font-medium text-white/80">
            {message.content}
          </span>
          {resultMessage ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-green-500" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-zinc-500" />
            </div>
          )}
        </div>

        {isExpanded && !isToolPanel && (
          <div className="mt-2 w-full space-y-2 border-t border-zinc-700 px-0 py-2 text-sm text-white/80 lg:px-3">
            <div className="font-medium text-zinc-400">
              工具：{message.tool_name}
            </div>
            {/* <div className="font-medium text-zinc-400">
              {t("input")}：{JSON.stringify(message.tool_args)}
            </div> */}
            {resultMessage && (
              <>
                <div className="font-medium text-zinc-400">結果：</div>
                <div className="pl-0 lg:pl-4">
                  <ToolResult
                    toolName={message.tool_name}
                    toolArgs={message.tool_args}
                    toolResult={resultMessage.tool_result}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
