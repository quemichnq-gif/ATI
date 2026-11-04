import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Phân tích và render inline formatting:
 * - **in đậm** -> <strong>
 * - *in nghiêng* -> <em>
 * - `code` -> <code>
 */
function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null;

  // Tách text theo token: **bold**, *italic*, `code`
  const regex = /(\*\*[\s\S]+?\*\*|\*[^*\n]+?\*|`[^`]+?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-white tracking-wide">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-purple-200/90 font-normal">
          {inner}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200 font-mono text-xs">
          {inner}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

/**
 * Component hiển thị nội dung Markdown chuẩn từ AI:
 * Hỗ trợ Heading (H1-H4), Divider (---), Bullet points (•, -, *), Bold (**), Italic (*)
 */
export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // 1. Dòng trống
        if (!trimmed) {
          return <div key={index} className="h-1.5" aria-hidden="true" />;
        }

        // 2. Divider line: --- hoặc ***
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return (
            <hr
              key={index}
              className="border-t border-purple-500/20 my-3"
            />
          );
        }

        // 3. Heading 1 hoặc 2: # hoặc ##
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          const text = trimmed.replace(/^#{1,2}\s+/, '');
          return (
            <h3
              key={index}
              className="text-base sm:text-lg font-bold text-amber-300 mt-4 mb-2 tracking-wide flex items-center gap-2"
            >
              {renderInlineFormatted(text)}
            </h3>
          );
        }

        // 4. Heading 3: ###
        if (trimmed.startsWith('### ')) {
          const text = trimmed.replace(/^###\s+/, '');
          return (
            <h3
              key={index}
              className="text-base sm:text-lg font-bold text-amber-300/95 mt-4 mb-2 tracking-wide flex items-center gap-2"
            >
              {renderInlineFormatted(text)}
            </h3>
          );
        }

        // 5. Heading 4: ####
        if (trimmed.startsWith('#### ')) {
          const text = trimmed.replace(/^####\s+/, '');
          return (
            <h4
              key={index}
              className="text-sm sm:text-base font-semibold text-purple-200 mt-3.5 mb-1.5 pt-2 border-t border-purple-500/15 flex items-center gap-1.5"
            >
              {renderInlineFormatted(text)}
            </h4>
          );
        }

        // 6. Bullet lists: • hoặc - hoặc * (nhưng không phải ** hay ***)
        const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
        if (bulletMatch && !trimmed.startsWith('***') && !trimmed.startsWith('**')) {
          const bulletContent = bulletMatch[2];
          return (
            <div key={index} className="flex items-start gap-2.5 pl-1.5 my-1">
              <span className="text-purple-400 text-xs mt-1 select-none leading-none">✦</span>
              <div className="text-purple-100 text-sm leading-relaxed flex-1">
                {renderInlineFormatted(bulletContent)}
              </div>
            </div>
          );
        }

        // 7. Đoạn văn thông thường
        return (
          <p key={index} className="text-purple-100 text-sm leading-relaxed opacity-95">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

