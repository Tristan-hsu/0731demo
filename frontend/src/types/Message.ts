export interface SessionHistory {
    sessionId: string;
    userId: string;
    title: string;
    messages: Message[];
    createdAt?: Date;
    updatedAt?: Date;
    user_case_id?: string;
  }
  
  export interface BrowserToolArgs {
    action: string;
    url?: string;
    scroll_amount?: number;
    goal?: string;
  }
  interface BaseMessage {
    role: "human" | "ai";
    content: string;
  }
  
  // 文本类型消息
  export interface TextMessage extends BaseMessage {
    type: "text";
    sources?: any[];
    prompts?: string[];
    prompt?: string;
  }
  
  // 工具使用类型消息
  export interface ToolUseMessage extends BaseMessage {
    type: "tool_use";
    tool_id: string;
    tool_name: string;
    tool_args: object | string | BrowserToolArgs;
  }
  
  // 工具结果类型消息
  export interface ToolResultMessage extends BaseMessage {
    type: "tool_result";
    tool_id: string;
    tool_name?: string; // 可选，用于显示结果标题
    tool_result: string;
  }
  export interface ChooseAgentMessage extends BaseMessage {
    type: "choose_agent";
    agent: string;
    content: string;
  }
  
  export interface ToolMessage {
    role: "ai";
    content: MessageType[];
  }
  export interface MessageType {
    type: "tool_use" | "tool_result";
    name: string;
    id: string;
    input: string;
  }
  
  export type Message =
    | TextMessage
    | ToolUseMessage
    | ToolResultMessage
    | ChooseAgentMessage;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}
  