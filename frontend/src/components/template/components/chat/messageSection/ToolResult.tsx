import { useState } from "react";
import { ReactMarkdownCustom } from "@/components/ReactMarkdownCustom";
import { processContent } from "@/utils/text";
import SearchLaws from "../toolResult/SearchLaws";
import SearchCases from "../toolResult/SearchCases";

export function ToolResult({
  toolName,
  toolArgs,
  toolResult,
}: {
  toolName: string;
  toolArgs: any;
  toolResult: string | object;
}): React.ReactNode {
  const [showAll, setShowAll] = useState(false);

  // 使用组件映射表替代if-else链
  const toolComponentMap: Record<string, React.ReactNode> = {
    search_laws: <SearchLaws results={toolResult} />,
    search_cases: <SearchCases results={toolResult} />,
  };

  if (toolResult && typeof toolResult === "object" && "error" in toolResult) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/20 p-4">
        <h3 className="mb-2 font-medium text-red-400">
          未知錯誤
        </h3>
        <p className="text-sm text-zinc-300">
          {toolResult.error ? String(toolResult.error) : "未知錯誤"}
        </p>
      </div>
    );
  }
  if (toolResult && typeof toolResult === "string") {
    try {
      const parsedResult = JSON.parse(toolResult);
      if (parsedResult.error) {
        return (
          <div className="rounded-md border border-red-500/50 bg-red-500/20 p-4">
            <h3 className="mb-2 font-medium text-red-400">
              未知錯誤
            </h3>
            <p className="text-sm text-zinc-300">
              {parsedResult.error ? String(parsedResult.error) : "未知錯誤"}
            </p>
          </div>
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
  // 如果有对应的组件，直接返回
  if (toolComponentMap[toolName]) {
    return toolComponentMap[toolName];
  }

  // 以下是原来的默认处理逻辑
  if (typeof toolResult === "string") {
    try {
      const parsedResult = JSON.parse(toolResult);

      // 如果是数组，显示为列表
      if (Array.isArray(parsedResult)) {
        return (
          <ul className="list-disc space-y-2 pl-5">
            {parsedResult.map((item, index) => (
              <li key={index}>
                {item.title ? (
                  <div>
                    <div className="font-medium">{item.title}</div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {item.link}
                      </a>
                    )}
                    {item.text && (
                      <div className="mt-1 text-xs text-white/70">
                        {item.text.slice(0, 200)}...
                      </div>
                    )}
                    {item.content && (
                      <div className="mt-1 text-xs text-white/70">
                        {item.content.slice(0, 200)}...
                      </div>
                    )}
                  </div>
                ) : (
                  <ReactMarkdownCustom className="text-sm">
                    {processContent(item, [])}
                  </ReactMarkdownCustom>
                )}
              </li>
            ))}
          </ul>
        );
      }

      // 如果是对象，显示键值对
      if (typeof parsedResult === "object" && parsedResult !== null) {
        return (
          <div className="space-y-1">
            {Object.entries(parsedResult).map(([key, value], index) => (
              <div key={index}>
                <span className="font-medium">{key}: </span>
                <span>
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        );
      }

      // 其他情况，返回JSON字符串
      return (
        <ReactMarkdownCustom className="text-sm">
          {processContent(JSON.stringify(parsedResult, null, 2), [])}
        </ReactMarkdownCustom>
      );
    } catch (e) {
      // 如果解析失败，说明不是JSON，直接显示文本
      console.log(e);
      const lines = toolResult.split("\n");
      const displayLines = showAll ? lines : lines.slice(0, 10);
      const hasMoreLines = lines.length > 10;

      return (
        <div>
          <ReactMarkdownCustom className="whitespace-pre-wrap text-sm">
            {processContent(displayLines.join("\n"), [])}
          </ReactMarkdownCustom>

          {hasMoreLines && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-sm text-primary hover:text-primary/80"
            >
              {showAll
                ? "收起"
                : ` 展開 (${lines.length} 行)`}
            </button>
          )}
        </div>
      );
    }
  } else {
    if (Array.isArray(toolResult)) {
      return (
        <ul className="list-disc space-y-2 pl-5">
          {toolResult.map((item, index) => (
            <li key={index}>
              <ReactMarkdownCustom className="text-sm">
                {processContent(item, [])}
              </ReactMarkdownCustom>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div>
        {JSON.stringify(toolResult)}
        {/* {Object.entries(toolResult).map(([key, value], index) => (
          <div key={index}>
            <span className="font-medium">{key}: </span>
            <span>{JSON.stringify(value)}</span>
          </div>
        ))} */}
      </div>
    );
  }
}
