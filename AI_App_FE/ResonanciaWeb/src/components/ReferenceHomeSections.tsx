import { useEffect, useRef } from 'react';

export default function ReferenceHomeSections() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let observer: ResizeObserver | undefined;
    const syncHeight = () => {
      const document = frame.contentDocument;
      if (!document) return;
      frame.style.height = `${Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0
      )}px`;
    };

    const handleLoad = () => {
      const document = frame.contentDocument;
      if (!document) return;
      syncHeight();
      observer = new ResizeObserver(syncHeight);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    };

    frame.addEventListener('load', handleLoad);
    return () => {
      frame.removeEventListener('load', handleLoad);
      observer?.disconnect();
    };
  }, []);

  return (
    <section aria-label="Các phần giao diện tham khảo Astrica" className="reference-home-sections">
      <iframe
        ref={frameRef}
        src="/astrica/reference-home.html"
        title="Các section trang chủ tham khảo Astrica"
        loading="eager"
        scrolling="no"
      />
    </section>
  );
}
