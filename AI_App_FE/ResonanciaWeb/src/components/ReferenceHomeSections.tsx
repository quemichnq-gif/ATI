import { useEffect, useRef } from 'react';

const serviceTargets: Record<string, { route: string; label: string }> = {
  'Natal/Birth chart reading': { route: '/natal', label: 'Mở Bản Đồ Sao' },
  'Zodiac compatibility': { route: '/match', label: 'Mở Ghép Đôi' },
  'Tarot card reading': { route: '/tarot', label: 'Mở Tarot' },
};

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
      document.querySelectorAll<HTMLElement>('.service-item-block').forEach((card) => {
        const titleLink = card.querySelector<HTMLAnchorElement>('.service-item-title');
        const target = titleLink?.textContent?.trim();
        const destination = target ? serviceTargets[target] : undefined;
        if (!destination) return;

        card.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
          link.setAttribute('href', destination.route);
          link.setAttribute('target', '_top');
          if (link.classList.contains('thumbnail-link-block')) {
            link.setAttribute('aria-label', destination.label);
          }
        });

        card.style.cursor = 'pointer';
        card.addEventListener('click', (event) => {
          const clickedElement = event.target as Element | null;
          if (clickedElement?.closest('a, button')) return;
          window.parent.location.assign(destination.route);
        });
      });
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
