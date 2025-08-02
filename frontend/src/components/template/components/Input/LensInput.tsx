"use client";

import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
interface LensInputProps {
  query: string;
  isChatLoading: boolean;
  isStreaming: boolean;
  handleStopChat: () => void;
  handleChatLens: (query: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  brandLogo?: React.ReactNode;
  className?: string;
}

export default function LensInput({
  query,
  isChatLoading,
  isStreaming,
  handleStopChat,
  handleChatLens,
  onChange,
  brandLogo,
  className,
}: LensInputProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({
    x: 0,
    y: 0,
    show: false,
  });
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isComposing) return;
      handleChatLens(query);
      setIsInputFocused(false);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inputContainerRef.current) return;

    const rect = inputContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRippleEffect({ x, y, show: true });

    setTimeout(() => {
      setRippleEffect((prev) => ({ ...prev, show: false }));
    }, 800);
  };

  return (
    <div className={cn("relative mx-auto flex w-full gap-1", "h-16 sm:h-20 md:h-24", className)}>
      {brandLogo && (
        <div className="flex w-16 sm:w-20 items-center justify-center rounded-md border border-border bg-muted px-2 sm:px-3 py-2 text-center text-xs text-muted-foreground">
          {brandLogo}
        </div>
      )}

      <div
        ref={inputContainerRef}
        onClick={handleInputClick}
        className={cn(
          "relative flex h-full w-full items-start rounded-md border border-border bg-muted transition-all duration-300",
          isInputFocused &&
          "soft-gradient-border shadow-[0_0_10px_rgba(59,130,246,0.15)]",
        )}
      >
        <div className="relative z-10 flex h-full w-full flex-col items-start overflow-hidden rounded-md">
          {rippleEffect.show && (
            <div
              className="animate-ripple pointer-events-none absolute h-[300px] w-[300px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(173,216,230,0.3) 30%, rgba(147,112,219,0.2) 70%, transparent 100%)",
                left: rippleEffect.x - 150,
                top: rippleEffect.y - 150,
              }}
            />
          )}

          <input
            value={query}
            placeholder="問我任何法律問題..."
            onChange={onChange}
            disabled={isChatLoading || isStreaming}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className="z-10 h-10 sm:h-12 w-full bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-foreground placeholder-muted-foreground/50 focus:outline-hidden"
          />
          <button
            onClick={() => handleChatLens(query)}
            className={cn(
              "absolute right-2 sm:right-3 rounded-sm bg-primary/20 p-1.5 sm:p-2 transition-all duration-300",
              "bottom-2 sm:bottom-3",
              !query && !isChatLoading && !isStreaming
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-primary/40 active:bg-primary/60",
            )}
          >
            {isChatLoading || isStreaming ? (
              <div className="size-3 bg-primary" />
            ) : (
              <ArrowUp className="size-3 sm:size-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
