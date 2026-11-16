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
 * Hỗ trợ Heading (H1-H4), Numbered Headings (1. 2.), Divider (---), Bullet points (•, -, *), Bold (**), Italic (*)
 */
export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-4 text-base sm:text-[16.5px] leading-[1.8] ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // 1. Dòng trống
        if (!trimmed) {
          return <div key={index} className="h-2" aria-hidden="true" />;
        }

        // 2. Divider line: --- hoặc ***
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return (
            <hr
              key={index}
              className="border-t border-purple-500/25 my-4"
            />
          );
        }

        // 3. Heading 1 hoặc 2: # hoặc ##
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
          const text = trimmed.replace(/^#{1,2}\s+/, '');
          return (
            <h3
              key={index}
              className="text-xl sm:text-2xl font-bold text-amber-300 mt-7 mb-3 tracking-wide flex items-center gap-2.5"
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
              className="text-lg sm:text-xl font-bold text-amber-300 mt-6 mb-2.5 tracking-wide flex items-center gap-2"
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
              className="text-base sm:text-lg font-bold text-purple-200 mt-5 mb-2 pt-2 border-t border-purple-500/20 flex items-center gap-2"
            >
              {renderInlineFormatted(text)}
            </h4>
          );
        }

        // 6. Tiêu đề mục có đánh số: ví dụ "1. Khí Chất...", "**1. Khí Chất...**", "2. Sở Trường..."
        const numberedHeadingMatch = trimmed.match(/^(?:#{1,4}\s*)?(?:\*\*)?([0-9]+[\.:\)]\s+[^\n]+?)(?:\*\*)?$/);
        if (numberedHeadingMatch && trimmed.length < 130 && !trimmed.endsWith('.')) {
          const headingText = numberedHeadingMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
          return (
            <h3
              key={index}
              className="text-lg sm:text-xl font-bold text-amber-300 mt-7 mb-3 tracking-wide flex items-center gap-2.5 border-b border-purple-500/25 pb-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 inline-block shadow-[0_0_10px_rgba(251,191,36,0.8)] shrink-0" />
              <span>{renderInlineFormatted(headingText)}</span>
            </h3>
          );
        }

        // 7. Bullet lists: • hoặc - hoặc * (nhưng không phải ** hay ***)
        const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
        if (bulletMatch && !trimmed.startsWith('***') && !trimmed.startsWith('**')) {
          const bulletContent = bulletMatch[2];
          return (
            <div key={index} className="flex items-start gap-3 pl-1.5 my-2">
              <span className="text-purple-300 text-sm mt-1.5 select-none leading-none">✦</span>
              <div className="text-purple-50/95 text-base sm:text-[16.5px] leading-[1.8] flex-1">
                {renderInlineFormatted(bulletContent)}
              </div>
            </div>
          );
        }

        // 8. Đoạn văn thông thường
        return (
          <p key={index} className="text-purple-50/95 text-base sm:text-[16.5px] leading-[1.8] font-normal tracking-normal">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

