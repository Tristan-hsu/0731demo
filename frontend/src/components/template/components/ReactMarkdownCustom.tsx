import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

interface ReactMarkdownCustomProps {
  children: string;
  className?: string;
}

export function ReactMarkdownCustom({
  children,
  className,
}: ReactMarkdownCustomProps) {
  return (
    <ReactMarkdown
      className={cn(className)}
      components={{
        h1: ({ ...props }) => (
          <h1 {...props} className="my-4 pb-2 text-2xl font-bold" />
        ),
        h2: ({ ...props }) => (
          <h2 {...props} className="my-3 pb-1 text-xl font-bold" />
        ),
        h3: ({ ...props }) => (
          <h3 {...props} className="my-2 text-lg font-bold" />
        ),
        h4: ({ ...props }) => (
          <h4 {...props} className="my-2 text-base font-semibold" />
        ),
        h5: ({ ...props }) => (
          <h5 {...props} className="my-1 text-sm font-semibold" />
        ),
        h6: ({ ...props }) => (
          <h6 {...props} className="my-1 text-sm font-medium" />
        ),
        p: ({ ...props }) => <p {...props} className="my-2 leading-7" />,
        ul: ({ ...props }) => (
          <ul {...props} className="markdown-list mb-3 mt-1 list-disc pl-6" />
        ),
        ol: ({ ...props }) => (
          <ol {...props} className="mb-3 mt-1 list-decimal pl-6" />
        ),
        li: ({ ...props }) => <li {...props} className="my-1 pl-1" />,
        a: ({
          href,
          children,
          ...props
        }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
          if (href?.startsWith("#")) {
            const source = href.substring(1);
            const buttonProps: ButtonHTMLAttributes<HTMLButtonElement> = {
              onClick: () => {
                const element = document.getElementById(source);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              },
              className:
                "inline-flex items-center justify-center rounded-md bg-card px-2 py-1 text-xs font-medium text-primary transition-colors",
            };
            return <button {...buttonProps}>{children}</button>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center mx-0.5 rounded-md bg-card px-1.5 py-1 text-xs font-medium text-primary transition-colors"
              {...props}
            >
              {children}
            </a >
          );
        },
        blockquote: ({ ...props }) => (
          <blockquote
            {...props}
            className="my-3 border-l-4 border-zinc-500 bg-zinc-100 bg-opacity-10 py-1 pl-4 italic"
          />
        ),
        code: (props) => {
          const { className, children, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return (
            <code
              className="rounded bg-zinc-700 px-1 py-0.5 font-mono text-sm text-zinc-200"
              {...rest}
            >
              {children}
            </code>
          );
        },
        pre: (props) => (
          <pre className="my-3 overflow-x-auto rounded-md bg-zinc-800 p-3">
            {props.children}
          </pre>
        ),
        img: ({ ...props }) => (
          <img {...props} className="my-3 h-auto max-w-full rounded-md" />
        ),
        hr: () => <hr className="my-6 border-border" />,
        table: ({ ...props }) => (
          <div className="my-4 overflow-x-auto">
            <table {...props} className="min-w-full divide-y divide-border" />
          </div>
        ),
        thead: ({ ...props }) => <thead {...props} className="bg-background" />,
        tbody: ({ ...props }) => (
          <tbody {...props} className="divide-y divide-border" />
        ),
        tr: ({ ...props }) => <tr {...props} className="" />,
        th: ({ ...props }) => (
          <th
            {...props}
            className="px-3 py-2 text-left text-sm font-semibold text-foreground"
          />
        ),
        td: ({ ...props }) => <td {...props} className="px-3 py-2 text-sm" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
