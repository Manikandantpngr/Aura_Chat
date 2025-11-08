'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  const fullContent = content + (isStreaming ? '▍' : '');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert prose-sm max-w-none"
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-6 my-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-6 my-2" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        p: ({ node, ...props }) => {
          // Find the cursor and wrap it in a span for animation
          const children = React.Children.toArray(props.children);
          const cursorIndex = children.findIndex(child => typeof child === 'string' && child.endsWith('▍'));
          
          if (cursorIndex !== -1) {
            const child = children[cursorIndex] as string;
            const textBeforeCursor = child.slice(0, -1);
            children[cursorIndex] = (
              <React.Fragment key={`cursor-${cursorIndex}`}>
                {textBeforeCursor}
                <span className="blinking-cursor">▍</span>
              </React.Fragment>
            );
          }
          
          return <p className="mb-2 last:mb-0" {...props}>{children}</p>;
        },
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeContent = React.Children.toArray(children).map(child => 
            typeof child === 'string' ? child.replace('▍', '') : child
          );

          return match ? (
            <div className="my-2 rounded-md bg-foreground/10">
               <div className="flex items-center justify-between px-3 py-1 border-b border-border">
                <span className="text-xs text-muted-foreground">{match[1]}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(String(codeContent))}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  copy
                </button>
              </div>
              <pre className="p-3 text-sm overflow-x-auto"><code {...props}>{codeContent}</code></pre>
            </div>
          ) : (
            <code className="bg-foreground/10 text-primary rounded-sm px-1 py-0.5 font-code" {...props}>
              {codeContent}
            </code>
          );
        },
      }}
    >
      {fullContent}
    </ReactMarkdown>
  );
}
