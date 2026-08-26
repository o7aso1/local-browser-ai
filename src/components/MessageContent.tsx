import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface Props {
  content: string
  variant: 'user' | 'assistant'
  streaming?: boolean
}

/** Fix common LLM markdown mistakes before render. */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/(\w+)```/g, '```$1\n')
    .replace(/```(\w+)([^\n])/g, '```$1\n$2')
    .replace(/```\s*\n\s*```/g, '```\n')
}

export function MessageContent({ content, variant, streaming }: Props) {
  const normalized = normalizeMarkdown(content)
  const isUser = variant === 'user'

  if (streaming) {
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  if (isUser) {
    return <p className="whitespace-pre-wrap break-words">{content}</p>
  }

  return (
    <div className="markdown-body text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            return (
              <pre className="code-block overflow-x-auto rounded-xl bg-[#0f172a] p-3 text-[13px] leading-relaxed text-[#e2e8f0]">
                {children}
              </pre>
            )
          },
          code({ className, children, ...props }) {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code
                className="rounded bg-black/8 px-1.5 py-0.5 font-mono text-[13px] text-[var(--accent)]"
                {...props}
              >
                {children}
              </code>
            )
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>
          },
          ul({ children }) {
            return <ul className="mb-2 list-disc pr-5">{children}</ul>
          },
          ol({ children }) {
            return <ol className="mb-2 list-decimal pr-5">{children}</ol>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] underline-offset-2 hover:underline"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  )
}
