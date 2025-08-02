import { useState, useCallback } from "react";
import { Message } from "@/types/Message";

interface UseChatProps {
//   userId: string | undefined;
//   sessionId: string | null;
  setQuery: (query: string) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
//   needLogin?: boolean;
  apiPath: string;
  extraParams?: Record<string, any>;
}

export const useChat = ({
//   userId,
//   sessionId,
  setQuery,
  chatContainerRef,
//   needLogin = true,
  apiPath,
  extraParams = {},
}: UseChatProps) => {
  const [isStopChat, setIsStopChat] = useState(false);
  const [currentChat, setCurrentChat] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleChat = useCallback(
    async (message: string, extraParamsInput?: Record<string, any>) => {
      if (!message) {
        return;
      }
      setIsStopChat(false);
      setIsChatLoading(true);
    //   if (needLogin && !userId) {
    //     toast.error("請先登入");
    //     setIsChatLoading(false);
    //     return;
    //   }
      const controller = new AbortController();
      const { signal } = controller;
      const timeoutId = setTimeout(() => controller.abort(), 600000);
      try {
        setCurrentChat((prev) => [
          ...prev,
          { role: "human", content: message, type: "text" },
          { role: "ai", content: "", type: "text" },
        ]);
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
              });
            }
          });
        }, 100);

        setQuery("");
        // let baseUrl = "";
        // let apiUrl = `${baseUrl}/${apiPath}`;
        // const env = process.env.NEXT_PUBLIC_BASE_URL;
        // if (env === "https://law.ask-lens.ai") {
        //   baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "";
        //   apiUrl = `${baseUrl}/${apiPath}`;
        // } else {
        //   baseUrl = process.env.NEXT_PUBLIC_BASE_APIDEV_URL || "";
        //   apiUrl = `${baseUrl}/${apiPath}`;
        // }

        // if (!apiUrl) {
        //   toast.error("API URL is not available");
        //   setIsChatLoading(false);
        //   return;
        // }

        // 在函数内部获取当前聊天记录，而不是依赖于依赖数组中的 currentChat
        const getCurrentChat = () => {
          let chatHistory: Message[] = [];
          setCurrentChat((current) => {
            chatHistory = [...current];
            return current;
          });
          return chatHistory;
        };
        const chatHistory = getCurrentChat();

        // 查找最后一条用户消息
        const lastHumanMessage = [...chatHistory]
          .reverse()
          .find((chat) => chat.role === "human");

        // 查找最后一条AI文本消息
        const lastAiTextMessage = [...chatHistory]
          .reverse()
          .find((chat) => chat.role === "ai" && chat.type === "text");
        const history = [];
        if (lastHumanMessage) {
          history.push({
            role: lastHumanMessage.role,
            content: lastHumanMessage.content,
          });
        }
        if (lastAiTextMessage) {
          history.push({
            role: lastAiTextMessage.role,
            content: lastAiTextMessage.content,
          });
        }

        const response = await fetch('http://localhost:8000/chat/stream', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            query: message,
            // user_id: userId,
            // session_id: sessionId,
            // lang: "tw",
            ...extraParams,
            ...extraParamsInput,
          }),
          signal, // 添加signal参数
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        setIsStreaming(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (isStopChat) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
                const jsonStr = line.replace("data: ", "");
                const parsedData = JSON.parse(jsonStr);
                if (parsedData.type === "start_response") {
                  setCurrentChat((prev) => {
                    // 找到最后一条 human 消息的索引
                    const lastHumanIndex = [...prev].findLastIndex(
                      (msg) => msg.role === "human"
                    );

                    // 初始化 sources 数组
                    let sources = [];

                    // 如果找到了 human 消息
                    if (lastHumanIndex !== -1) {
                      // 查找该 human 消息之后的消息中是否有符合条件的 tool_result 消息
                      for (let i = lastHumanIndex + 1; i < prev.length; i++) {
                        const msg = prev[i];
                        if (
                          msg.type === "tool_result" &&
                          msg.tool_name === "search_laws" &&
                          msg.tool_result
                        ) {
                          sources = msg.tool_result as any;
                          break;
                        }
                      }
                    }
                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: "",
                        sources: sources,
                        prompts: [],
                        type: "text",
                      },
                    ];
                  });
                }
                if (parsedData.chunk) {
                  setCurrentChat((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (
                      lastMessage &&
                      lastMessage.role === "ai" &&
                      lastMessage.type === "text"
                    ) {
                      const updatedChat = [...prev];
                      updatedChat[updatedChat.length - 1] = {
                        role: "ai",
                        content: lastMessage.content + parsedData.chunk,
                        sources: lastMessage.sources,
                        prompts: lastMessage.prompts,
                        type: "text",
                      };
                      return updatedChat;
                    }

                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: parsedData.chunk,
                        type: "text",
                      },
                    ];
                  });
                }
                if (parsedData.done) {
                  setIsStreaming(false);
                }
                if (parsedData.type === "text") {
                  setCurrentChat((prev) => {
                    // 直接添加新消息，不再查找和更新现有消息
                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: parsedData.content,
                        type: "text",
                      },
                    ];
                  });
                }
                if (parsedData.type === "tool_use") {
                  setCurrentChat((prev) => {
                    // 直接添加新消息，不再查找和更新现有消息
                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: parsedData.content,
                        tool_id: parsedData.tool_id,
                        tool_name: parsedData.tool_name,
                        tool_args: parsedData.tool_args,
                        type: "tool_use",
                      },
                    ];
                  });
                }
                if (parsedData.type === "tool_result") {
                  setCurrentChat((prev) => {
                    // 直接添加新消息，不再查找和更新现有消息
                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: "",
                        tool_result: parsedData.tool_result,
                        tool_id: parsedData.tool_id,
                        tool_name: parsedData.tool_name,
                        type: "tool_result",
                      },
                    ];
                  });
                }
                if (parsedData.type === "prompts") {
                  setCurrentChat((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (
                      lastMessage &&
                      lastMessage.role === "ai" &&
                      lastMessage.type === "text"
                    ) {
                      const updatedChat = [...prev];
                      updatedChat[updatedChat.length - 1] = {
                        role: "ai",
                        content: lastMessage.content,
                        prompts: parsedData.content,
                        type: "text",
                      };
                      return updatedChat;
                    }

                    return [
                      ...prev,
                      {
                        role: "ai",
                        content: lastMessage.content,
                        prompts: parsedData.content,
                        type: "text",
                      },
                    ];
                  });
                }
              } catch (e) {
                console.warn("Failed to parse line:", e);
              }
            }
          }
        }
        if (buffer.trim()) {
          try {
            const parsedData = JSON.parse(buffer);
            if (parsedData.chunk) {
              setCurrentChat((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === "ai") {
                  const updatedChat = [...prev];
                  updatedChat[updatedChat.length - 1] = {
                    role: "ai",
                    content: lastMessage.content + parsedData.chunk,
                    type: "text",
                  };
                  return updatedChat;
                }

                return [
                  ...prev,
                  {
                    role: "ai",
                    content: parsedData.chunk,
                    type: "text",
                  },
                ];
              });
            }
            if (parsedData.done) {
              setIsStreaming(false);
            }
          } catch (e) {
            console.warn("Failed to parse final buffer:", e);
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
        throw error;
      } finally {
        setIsChatLoading(false);
        setIsStreaming(false);
        clearTimeout(timeoutId);
        setIsStopChat(false);
      }
    },
    // 添加新的依赖项
    [isStopChat, chatContainerRef]
  );


  return {
    handleChat,
    isStopChat,
    setIsStopChat,
    currentChat,
    setCurrentChat,
    isChatLoading,
    isStreaming,
  };
};
