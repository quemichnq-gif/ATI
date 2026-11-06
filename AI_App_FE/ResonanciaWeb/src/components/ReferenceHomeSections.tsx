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
    let animationFrame = 0;
    let isInitialized = false;
    let cleanupListeners = () => {};
    let triggerSmoothUpdate = () => {};

    // LERP smoothing state (Webflow IX2 style smoothing)
    let currentProgress = 0;
    let targetProgress = 0;
    let isLerping = false;

    const syncHeight = () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      frame.style.height = `${Math.max(
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight ?? 0
      )}px`;
    };

    const setupFrame = () => {
      if (isInitialized) return;
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;

      const ctaSection = doc.querySelector<HTMLElement>('.cta-section');
      if (!ctaSection) return;

      isInitialized = true;

      // Ẩn / gỡ bỏ huy hiệu Webflow
      doc.querySelectorAll('.w-webflow-badge').forEach((el) => el.remove());

      // 1. Cấu hình các liên kết điều hướng dịch vụ
      doc.querySelectorAll<HTMLElement>('.service-item-block').forEach((card) => {
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

      // 2. Hiệu ứng cuộn vòng hoàng đạo “Secret Universe’s”
      const ctaContentBlock = ctaSection.querySelector<HTMLElement>('.cta-content-block');
      const ctaImageWrapper = ctaSection.querySelector<HTMLElement>('.cta-image-wrapper');
      const ctaImageBlock = ctaSection.querySelector<HTMLElement>('.cta-image-block');
      const leftWheel = ctaSection.querySelector<HTMLElement>('.cta-image.left-image');
      const rightWheel = ctaSection.querySelector<HTMLElement>('.cta-image.right-image');
      const titleImage = ctaSection.querySelector<HTMLElement>('.cta-title-image');

      if (ctaImageWrapper && leftWheel && rightWheel && ctaContentBlock) {
        ctaImageWrapper.style.zIndex = '3';
        ctaImageWrapper.style.pointerEvents = 'none';
        ctaContentBlock.style.position = 'relative';
        ctaContentBlock.style.zIndex = '1';

        leftWheel.style.willChange = 'transform';
        rightWheel.style.willChange = 'transform';
        if (ctaImageBlock) ctaImageBlock.style.willChange = 'transform';
        if (titleImage) {
          titleImage.style.transformOrigin = 'center center';
          titleImage.style.willChange = 'transform';
        }

        const computeTargetProgress = (): number => {
          const viewportHeight = window.innerHeight;
          const frameRect = frame.getBoundingClientRect();
          const ctaRect = ctaSection.getBoundingClientRect();
          const liveSectionTop = frameRect.top + ctaRect.top;

          // Section bắt đầu vào từ đáy màn hình -> progress = 0
          // Section tiến đến giữa màn hình (<= 20% viewport) -> progress = 1
          const spinStart = viewportHeight + 60;
          const splitEnd = viewportHeight * 0.20;

          if (liveSectionTop >= spinStart) {
            return 0;
          }
          if (liveSectionTop <= splitEnd) {
            return 1;
          }
          return Math.max(0, Math.min(1, (spinStart - liveSectionTop) / (spinStart - splitEnd)));
        };

        const applyStyles = (p: number) => {
          const isMobile = window.innerWidth < 768;
          const maxSpread = isMobile
            ? Math.min(window.innerWidth * 0.28, 220)
            : Math.min(window.innerWidth * 0.38, 560);

          if (p <= 0.001) {
            // Còn ở xa phía dưới màn hình
            ctaImageWrapper.style.opacity = '0';
            if (ctaImageBlock) ctaImageBlock.style.transform = 'rotate(-180deg)';
            leftWheel.style.transform = 'translate3d(0, 0, 0)';
            rightWheel.style.transform = 'translate3d(0, 0, 0)';
            ctaContentBlock.style.opacity = '0';
            if (titleImage) titleImage.style.transform = 'scale(0)';
            ctaContentBlock.style.zIndex = '1';
          } else if (p < 0.45) {
            // Giai đoạn 1: Vòng tròn khép kín hoàn toàn, xoay mượt mà từ -180° về 0°
            // Chữ ẩn 100% để vòng tròn là tâm điểm
            const t1 = p / 0.45;
            const angle = -180 * (1 - t1);

            ctaImageWrapper.style.opacity = String(Math.min(1, t1 * 2));
            if (ctaImageBlock) ctaImageBlock.style.transform = `rotate(${angle.toFixed(2)}deg)`;
            leftWheel.style.transform = 'translate3d(0, 0, 0)';
            rightWheel.style.transform = 'translate3d(0, 0, 0)';
            ctaContentBlock.style.opacity = '0';
            if (titleImage) titleImage.style.transform = 'scale(0)';
            ctaContentBlock.style.zIndex = '1';
          } else if (p < 0.999) {
            // Giai đoạn 2: Xoay xong (giữ 0°), 2 nửa tách dần ra 2 bên, chữ và ảnh hiện dần lên
            const t2 = (p - 0.45) / 0.55;
            const currentSpread = maxSpread * t2;

            ctaImageWrapper.style.opacity = '1';
            if (ctaImageBlock) ctaImageBlock.style.transform = 'rotate(0deg)';
            leftWheel.style.transform = `translate3d(${-currentSpread.toFixed(1)}px, 0, 0)`;
            rightWheel.style.transform = `translate3d(${currentSpread.toFixed(1)}px, 0, 0)`;

            const contentOp = Math.min(1, t2 * 1.3);
            ctaContentBlock.style.opacity = contentOp.toFixed(3);
            if (titleImage) titleImage.style.transform = `scale(${Math.min(1, t2 * 1.25).toFixed(3)})`;
            ctaContentBlock.style.zIndex = t2 > 0.6 ? '4' : '1';
          } else {
            // Giai đoạn 3: Đã đến giữa trang và tiếp tục cuộn qua -> NỘI DUNG MỞ ĐẦY ĐỦ 100%!
            if (ctaImageBlock) ctaImageBlock.style.transform = 'rotate(0deg)';
            leftWheel.style.transform = `translate3d(${-maxSpread}px, 0, 0)`;
            rightWheel.style.transform = `translate3d(${maxSpread}px, 0, 0)`;
            ctaContentBlock.style.opacity = '1';
            if (titleImage) titleImage.style.transform = 'scale(1)';
            ctaContentBlock.style.zIndex = '4';

            // Khi cuộn vượt xa khỏi section mới mờ dần
            const frameRect = frame.getBoundingClientRect();
            const ctaRect = ctaSection.getBoundingClientRect();
            const liveSectionTop = frameRect.top + ctaRect.top;
            const sectionHeight = ctaSection.offsetHeight || 650;

            if (liveSectionTop < -sectionHeight * 0.70) {
              const exitEnd = -sectionHeight * 1.2;
              const exitT = Math.max(0, Math.min(1, (-sectionHeight * 0.70 - liveSectionTop) / (-sectionHeight * 0.70 - exitEnd)));
              ctaImageWrapper.style.opacity = String(Math.max(0, 1 - exitT));
            } else {
              ctaImageWrapper.style.opacity = '1';
            }
          }
        };

        // LERP Smooth Scroll Engine
        const lerpLoop = () => {
          targetProgress = computeTargetProgress();
          const diff = targetProgress - currentProgress;

          if (Math.abs(diff) < 0.003) {
            currentProgress = targetProgress;
            applyStyles(currentProgress);
            isLerping = false;
            return;
          }

          currentProgress += diff * 0.12;
          applyStyles(currentProgress);
          animationFrame = window.requestAnimationFrame(lerpLoop);
        };

        const triggerSmoothUpdate = () => {
          targetProgress = computeTargetProgress();
          if (!isLerping) {
            isLerping = true;
            animationFrame = window.requestAnimationFrame(lerpLoop);
          }
        };

        const contentWin = frame.contentWindow;
        const contentDoc = frame.contentDocument;

        window.addEventListener('scroll', triggerSmoothUpdate, { passive: true });
        window.addEventListener('wheel', triggerSmoothUpdate, { passive: true });
        window.addEventListener('touchmove', triggerSmoothUpdate, { passive: true });
        window.addEventListener('resize', triggerSmoothUpdate, { passive: true });
        document.addEventListener('scroll', triggerSmoothUpdate, { capture: true, passive: true });

        if (contentWin) {
          contentWin.addEventListener('scroll', triggerSmoothUpdate, { passive: true });
          contentWin.addEventListener('wheel', triggerSmoothUpdate, { passive: true });
          contentWin.addEventListener('touchmove', triggerSmoothUpdate, { passive: true });
        }
        if (contentDoc) {
          contentDoc.addEventListener('scroll', triggerSmoothUpdate, { capture: true, passive: true });
          contentDoc.addEventListener('wheel', triggerSmoothUpdate, { passive: true });
          contentDoc.addEventListener('touchmove', triggerSmoothUpdate, { passive: true });
        }

        cleanupListeners = () => {
          window.removeEventListener('scroll', triggerSmoothUpdate);
          window.removeEventListener('wheel', triggerSmoothUpdate);
          window.removeEventListener('touchmove', triggerSmoothUpdate);
          window.removeEventListener('resize', triggerSmoothUpdate);
          document.removeEventListener('scroll', triggerSmoothUpdate, true);
          if (contentWin) {
            contentWin.removeEventListener('scroll', triggerSmoothUpdate);
            contentWin.removeEventListener('wheel', triggerSmoothUpdate);
            contentWin.removeEventListener('touchmove', triggerSmoothUpdate);
          }
          if (contentDoc) {
            contentDoc.removeEventListener('scroll', triggerSmoothUpdate, true);
            contentDoc.removeEventListener('wheel', triggerSmoothUpdate);
            contentDoc.removeEventListener('touchmove', triggerSmoothUpdate);
          }
        };

        // Khởi tạo tức thì
        targetProgress = computeTargetProgress();
        currentProgress = targetProgress;
        applyStyles(currentProgress);
      }

      syncHeight();
      observer = new ResizeObserver(() => {
        syncHeight();
        // Khi các ảnh trong iframe load xong làm thay đổi chiều cao/vị trí layout, cập nhật ngay
        if (isInitialized) {
          triggerSmoothUpdate();
        }
      });
      observer.observe(doc.documentElement);
      if (doc.body) observer.observe(doc.body);
    };

    // Kiểm tra trạng thái tải của iframe để khởi tạo ngay
    if (frame.contentDocument && frame.contentDocument.readyState !== 'loading') {
      setupFrame();
    }
    frame.addEventListener('load', setupFrame);

    const checkInterval = window.setInterval(() => {
      if (isInitialized) {
        window.clearInterval(checkInterval);
      } else {
        setupFrame();
      }
    }, 150);

    return () => {
      frame.removeEventListener('load', setupFrame);
      window.clearInterval(checkInterval);
      observer?.disconnect();
      cleanupListeners();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
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
