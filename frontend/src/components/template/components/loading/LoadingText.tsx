import { cn } from "@/lib/utils";

export default function LoadingText({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-10", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-6 border-2 border-primary rounded-full opacity-20 animate-ping"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-4 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
