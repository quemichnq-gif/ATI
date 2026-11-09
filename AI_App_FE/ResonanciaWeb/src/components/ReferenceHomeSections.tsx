import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const serviceTargets: Record<string, { route: string; label: string }> = {
  'Natal/Birth chart reading': { route: '/natal', label: 'Mở Bản Đồ Sao' },
  'Zodiac compatibility': { route: '/match', label: 'Mở Ghép Đôi' },
  'Tarot card reading': { route: '/tarot', label: 'Mở Tarot' },
  'Đọc bản đồ sao ngày sinh': { route: '/natal', label: 'Mở Bản Đồ Sao' },
  'Tương hợp cung hoàng đạo': { route: '/match', label: 'Mở Ghép Đôi' },
  'Trải bài Tarot định mệnh': { route: '/tarot', label: 'Mở Tarot' },
};

const caseTargets: Record<string, string> = {
  'educational guidance through the lens of astrology': '/natal',
  'how astrology can elevate your event planning': '/prediction',
  'career guidance through the lens of astrology': '/natal',
  'unveiling relationship dynamics through astrology': '/match',
  'định hướng giáo dục qua lăng kính chiêm tinh': '/natal',
  'cách chiêm tinh nâng tầm kế hoạch sự kiện của bạn': '/prediction',
  'tiếp cận mới trong chăm sóc sức khỏe cá nhân': '/natal',
  'định hướng sự nghiệp qua lăng kính chiêm tinh': '/natal',
};

export default function ReferenceHomeSections() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const { uid } = useSelector((s: RootState) => s.auth);
  const uidRef = useRef(uid);

  const applyActionLinks = (targetDoc: Document) => {
    targetDoc.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      const text = link.textContent?.trim().toLowerCase() || '';
      const isAllService = text.includes('all service') || text.includes('tất cả dịch vụ');
      const isGetMoreDetail = text.includes('more detail') || text.includes('get more') || text.includes('chi tiết') || text.includes('tìm hiểu thêm');
      const isArticles = text.includes('all articles') || text.includes('bài viết') || text.includes('articles');

      if (isAllService || isGetMoreDetail || isArticles) {
        const isUnauth = !uidRef.current;
        const targetRoute = isUnauth ? '/register' : (isAllService ? '/assistant' : (isArticles ? '/glossary' : '/prediction'));
        link.setAttribute('href', targetRoute);
        link.setAttribute('target', '_top');

        if (!link.dataset.hasAuthHandler) {
          link.dataset.hasAuthHandler = 'true';
          link.style.cursor = 'pointer';
          link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const destination = !uidRef.current ? '/register' : (isAllService ? '/assistant' : (isArticles ? '/glossary' : '/prediction'));
            try {
              navigate(destination);
            } catch {
              window.parent.location.assign(destination);
            }
          }, true);
        }
      }
    });

    // Cấu hình các thẻ bài viết (Blog cards)
    targetDoc.querySelectorAll<HTMLElement>('.blog-item-block').forEach((card) => {
      const isUnauth = !uidRef.current;
      const targetRoute = isUnauth ? '/register' : '/glossary';

      card.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        link.setAttribute('href', targetRoute);
        link.setAttribute('target', '_top');
      });

      if (!card.dataset.hasAuthHandler) {
        card.dataset.hasAuthHandler = 'true';
        card.style.cursor = 'pointer';
        card.addEventListener('click', (event) => {
          const clickedElement = event.target as Element | null;
          if (clickedElement?.closest('a, button')) return;
          const finalRoute = !uidRef.current ? '/register' : '/glossary';
          try {
            navigate(finalRoute);
          } catch {
            window.parent.location.assign(finalRoute);
          }
        });
      }
    });
  };

  useEffect(() => {
    uidRef.current = uid;
    const doc = frameRef.current?.contentDocument;
    if (doc) {
      applyActionLinks(doc);
    }
  }, [uid]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let observer: ResizeObserver | undefined;
    let animationFrame = 0;
    let isInitialized = false;
    let cleanupListeners = () => {};
    let triggerSmoothUpdate = () => {};

    // LERP smoothing state (Webflow IX2 style smoothing)
    let ctaCurrentProgress = 0;
    let ctaTargetProgress = 0;

    let caseCurrentProgress = 0;
    let caseTargetProgress = 0;

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
      const caseSection = doc.querySelector<HTMLElement>('.case-studies-section');
      if (!ctaSection && !caseSection) return;

      isInitialized = true;

      // Ẩn / gỡ bỏ huy hiệu Webflow
      doc.querySelectorAll('.w-webflow-badge').forEach((el) => el.remove());

      // 1. Cấu hình các liên kết điều hướng dịch vụ
      doc.querySelectorAll<HTMLElement>('.service-item-block').forEach((card) => {
        const titleLink = card.querySelector<HTMLAnchorElement>('.service-item-title');
        const target = titleLink?.textContent?.trim() || '';
        let destination = serviceTargets[target];

        if (!destination) {
          const lower = target.toLowerCase();
          if (lower.includes('bản đồ') || lower.includes('natal') || lower.includes('birth chart')) {
            destination = serviceTargets['Đọc bản đồ sao ngày sinh'];
          } else if (lower.includes('tương hợp') || lower.includes('compatibility')) {
            destination = serviceTargets['Tương hợp cung hoàng đạo'];
          } else if (lower.includes('tarot')) {
            destination = serviceTargets['Trải bài Tarot định mệnh'];
          }
        }

        if (!destination) return;

        const isUnauth = !uidRef.current;
        const targetRoute = isUnauth ? '/register' : destination.route;

        card.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
          link.setAttribute('href', targetRoute);
          link.setAttribute('target', '_top');
          if (link.classList.contains('thumbnail-link-block')) {
            link.setAttribute('aria-label', destination.label);
          }
        });

        card.style.cursor = 'pointer';
        card.addEventListener('click', (event) => {
          const clickedElement = event.target as Element | null;
          if (clickedElement?.closest('a, button')) return;
          const finalRoute = !uidRef.current ? '/register' : destination.route;
          try {
            navigate(finalRoute);
          } catch {
            window.parent.location.assign(finalRoute);
          }
        });
      });

      // 2. Cấu hình các liên kết điều hướng Case Studies
      doc.querySelectorAll<HTMLElement>('.case-studies-item-block').forEach((card) => {
        const titleLink = card.querySelector<HTMLAnchorElement>('.case-studies-item-title');
        const text = titleLink?.textContent?.trim().toLowerCase() || '';
        let targetRoute = '/natal';
        for (const [key, route] of Object.entries(caseTargets)) {
          if (text.includes(key) || key.includes(text)) {
            targetRoute = route;
            break;
          }
        }

        const isUnauth = !uidRef.current;
        const finalRoute = isUnauth ? '/register' : targetRoute;

        card.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
          link.setAttribute('href', finalRoute);
          link.setAttribute('target', '_top');
        });

        card.style.cursor = 'pointer';
        card.addEventListener('click', (event) => {
          const clickedElement = event.target as Element | null;
          if (clickedElement?.closest('a, button')) return;
          const destination = !uidRef.current ? '/register' : targetRoute;
          try {
            navigate(destination);
          } catch {
            window.parent.location.assign(destination);
          }
        });
      });

      // 3. Cấu hình các nút "All service" và "Get more detail"
      applyActionLinks(doc);

      // 4. Đồng bộ & tinh chỉnh giao diện CTA Section (Secret Universe's)
      const ctaTitle = ctaSection?.querySelector<HTMLElement>('.cta-title');
      if (ctaTitle) {
        // Gỡ bỏ hình nhỏ cạnh chữ Secret
        ctaTitle.querySelectorAll('.cta-title-image').forEach((img) => img.remove());

        let secretEl = ctaTitle.querySelector<HTMLElement>('.cta-title-secret');
        let universeEl = ctaTitle.querySelector<HTMLElement>('.cta-title-span');

        if (!secretEl) {
          ctaTitle.innerHTML = `
            <span class="cta-title-secret">Secret</span>
            <span class="cta-title-span">Universe's</span>
          `;
          secretEl = ctaTitle.querySelector<HTMLElement>('.cta-title-secret');
          universeEl = ctaTitle.querySelector<HTMLElement>('.cta-title-span');
        }

        if (secretEl) {
          secretEl.style.display = 'block';
          secretEl.style.textAlign = 'center';
          secretEl.style.fontStyle = 'italic';
          secretEl.style.color = '#ffffff';
        }

        if (universeEl) {
          universeEl.style.display = 'block';
          universeEl.style.textAlign = 'center';
          universeEl.style.background = 'linear-gradient(135deg, #ffffff 5%, #d8b4fe 25%, #ff6eb4 50%, #4cc9f0 75%, #9d4edd 100%)';
          universeEl.style.setProperty('-webkit-background-clip', 'text');
          universeEl.style.setProperty('-webkit-text-fill-color', 'transparent');
          universeEl.style.backgroundClip = 'text';
          universeEl.style.filter = 'drop-shadow(0 0 35px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 65px rgba(76, 201, 240, 0.4))';
        }

        ctaTitle.style.display = 'flex';
        ctaTitle.style.flexDirection = 'column';
        ctaTitle.style.alignItems = 'center';
        ctaTitle.style.justifyContent = 'center';
        ctaTitle.style.textAlign = 'center';
      }

      const ctaDesc = ctaSection?.querySelector<HTMLElement>('.cta-info-desc');
      if (ctaDesc) {
        ctaDesc.textContent = 'Khám phá những điều vũ trụ đã an bài cho bạn. Hãy bắt đầu hành trình ngay hôm nay!';
      }

      const ctaBtnText = ctaSection?.querySelector<HTMLElement>('.cta-btn-block .btn-block-text');
      if (ctaBtnText) {
        ctaBtnText.textContent = 'Xem chi tiết';
      }

      const ctaInfoWrapper = ctaSection?.querySelector<HTMLElement>('.cta-info-wrapper');
      if (ctaInfoWrapper) {
        ctaInfoWrapper.style.marginTop = window.innerWidth <= 767 ? '28px' : (window.innerWidth <= 991 ? '36px' : '52px');
      }

      // 5. Hiệu ứng cuộn vòng hoàng đạo “Secret Universe’s”
      const ctaContentBlock = ctaSection?.querySelector<HTMLElement>('.cta-content-block');
      const ctaImageWrapper = ctaSection?.querySelector<HTMLElement>('.cta-image-wrapper');
      const ctaImageBlock = ctaSection?.querySelector<HTMLElement>('.cta-image-block');
      const leftWheel = ctaSection?.querySelector<HTMLElement>('.cta-image.left-image');
      const rightWheel = ctaSection?.querySelector<HTMLElement>('.cta-image.right-image');
      const titleImage = ctaSection?.querySelector<HTMLElement>('.cta-title-image');

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
      }

      // 4. Hiệu ứng cuộn Case Studies (“Illuminate your way” sticky marquee + card wobble/rotate)
      const stickyBlock = caseSection?.querySelector<HTMLElement>('.case-studies-sticky-block');
      const wrap1 = caseSection?.querySelector<HTMLElement>('.case-studies-wrap.wrap-1');
      const wrap2 = caseSection?.querySelector<HTMLElement>('.case-studies-wrap.wrap-2');
      const wrap3 = caseSection?.querySelector<HTMLElement>('.case-studies-wrap.wrap-3');
      const wrap4 = caseSection?.querySelector<HTMLElement>('.case-studies-wrap.wrap-4');
      const inner = caseSection?.querySelector<HTMLElement>('.case-studies-section-inner');
      const testimonialSection = doc.querySelector<HTMLElement>('.testimonial-section');

      // Khóa vùng hiển thị: section relative để z-index hoạt động, KHÔNG overflow:hidden
      // (overflow:hidden sẽ phá CSS position:sticky bên trong)
      if (caseSection) {
        caseSection.style.overflow = 'hidden'; // clip marquee + card, sticky vẫn ok vì đây là direct parent
        caseSection.style.position = 'relative';
        caseSection.style.zIndex = '2';
      }

      if (testimonialSection) {
        testimonialSection.style.position = 'relative';
        testimonialSection.style.zIndex = '5';
      }

      // stickyBlock: giả lập sticky bằng JS translate3d (iframe không scroll nên CSS sticky không hoạt động)
      // Isolate khỏi stacking context bằng transform: translateZ(0) để GPU không repaint marquee khi scroll
      if (stickyBlock) {
        stickyBlock.style.position = 'relative';
        stickyBlock.style.top = '0px';
        stickyBlock.style.zIndex = '1'; // dưới các card (.case-studies-section-inner z-index:3)
        stickyBlock.style.pointerEvents = 'none';
        stickyBlock.style.willChange = 'transform';
        // contain: layout để browser không phải layout lại toàn trang khi translate3d thay đổi
        (stickyBlock.style as CSSStyleDeclaration & { contain?: string }).contain = 'layout';
      }

      if (inner) {
        inner.style.position = 'relative';
        inner.style.zIndex = '3'; // cao hơn stickyBlock (1) → card luôn đè lên chữ
      }

      [wrap1, wrap2, wrap3, wrap4].forEach((wrap) => {
        if (wrap) {
          wrap.style.willChange = 'transform';
          wrap.style.transformOrigin = 'center center';
        }
      });

      // Marquee chạy ngang thuần CSS trên GPU compositor — animation riêng isolate hoàn toàn
      // stickyBlock dùng will-change:transform → tạo compositing layer riêng → marquee animation
      // chạy trong layer đó không bị ảnh hưởng khi JS translate3d thay đổi stickyBlock.transform
      if (caseSection && !doc.getElementById('case-studies-marquee-keyframes')) {
        const style = doc.createElement('style');
        style.id = 'case-studies-marquee-keyframes';
        style.textContent = `
          @keyframes csPureGpuMarquee {
            from { transform: translate3d(0, 0, 0); }
            to   { transform: translate3d(-50%, 0, 0); }
          }
          .case-studies-marquee-wrap {
            display: flex !important;
            flex-wrap: nowrap !important;
            width: max-content !important;
            will-change: transform;
            animation: csPureGpuMarquee 28s linear infinite;
          }
          /* Clip marquee tại đúng ranh giới container */
          .case-studies-marquee {
            overflow: hidden !important;
          }
          /* Triệt tiêu Webflow IX2 a-17 (PAGE_START, loop:true) đang write translateX
             vào .case-studies-marquee-block song song với CSS animation của ta → gây jitter */
          .case-studies-marquee-block {
            transform: none !important;
            animation: none !important;
          }
        `;
        doc.head.appendChild(style);
      }

      // Triệt tiêu Webflow IX2 a-17 (PAGE_START, loop:true) ở mức JS:
      // Webflow dùng element.style.transform = "translateX(-100%)" → luôn thắng CSS !important.
      // Chặn bằng Object.defineProperty: khi Webflow set .transform trên block, ta no-op.
      // .case-studies-marquee-wrap vẫn được CSS animation của ta control hoàn toàn.
      if (caseSection) {
        caseSection.querySelectorAll<HTMLElement>('.case-studies-marquee-block').forEach((block) => {
          try {
            Object.defineProperty(block.style, 'transform', {
              set(_val: string) { /* chặn Webflow IX2 write */ },
              get() { return ''; },
              configurable: true,
            });
          } catch {
            // Fallback nếu defineProperty không được phép trên iframe DOM
          }
        });
      }

      // Bộ đệm toạ độ phần cứng: ĐO 1 LẦN DUY NHẤT, TUYỆT ĐỐI KHÔNG ĐO LẠI TRONG SỰ KIỆN CUỘN
      let cachedFrameTop = 0;
      let cachedCtaTop = 0;
      let cachedCtaHeight = 650;
      let cachedCaseTop = 0;
      let cachedCaseHeight = 1600;
      let cachedStickyOffsetTop = 100;
      let cachedStickyHeight = 60;

      const measureLayout = () => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        cachedFrameTop = frame.getBoundingClientRect().top + scrollY;

        if (ctaSection) {
          cachedCtaTop = ctaSection.offsetTop;
          cachedCtaHeight = ctaSection.offsetHeight || 650;
        }

        if (caseSection) {
          cachedCaseTop = caseSection.offsetTop;
          cachedCaseHeight = caseSection.offsetHeight || 1600;
          if (stickyBlock) {
            cachedStickyOffsetTop = stickyBlock.offsetTop || 100;
            cachedStickyHeight = stickyBlock.offsetHeight || 60;
          }
        }
      };

      measureLayout();

      const interpolate = (k: number, k1: number, v1: number, k2: number, v2: number): number => {
        if (k <= k1) return v1;
        if (k >= k2) return v2;
        return v1 + ((k - k1) / (k2 - k1)) * (v2 - v1);
      };

      const applyCtaStyles = (p: number, liveSectionTop: number) => {
        if (!ctaSection || !ctaImageWrapper || !leftWheel || !rightWheel || !ctaContentBlock) return;
        const isMobile = window.innerWidth < 768;
        const maxSpread = isMobile
          ? Math.min(window.innerWidth * 0.28, 220)
          : Math.min(window.innerWidth * 0.38, 560);

        if (p <= 0.001) {
          ctaImageWrapper.style.opacity = '0';
          if (ctaImageBlock) ctaImageBlock.style.transform = 'rotate(-180deg)';
          leftWheel.style.transform = 'translate3d(0, 0, 0)';
          rightWheel.style.transform = 'translate3d(0, 0, 0)';
          ctaContentBlock.style.opacity = '0';
          if (titleImage) titleImage.style.transform = 'scale(0)';
          ctaContentBlock.style.zIndex = '1';
        } else if (p < 0.45) {
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
          if (ctaImageBlock) ctaImageBlock.style.transform = 'rotate(0deg)';
          leftWheel.style.transform = `translate3d(${-maxSpread}px, 0, 0)`;
          rightWheel.style.transform = `translate3d(${maxSpread}px, 0, 0)`;
          ctaContentBlock.style.opacity = '1';
          if (titleImage) titleImage.style.transform = 'scale(1)';
          ctaContentBlock.style.zIndex = '4';

          const sectionHeight = cachedCtaHeight;
          if (liveSectionTop < -sectionHeight * 0.70) {
            const exitEnd = -sectionHeight * 1.2;
            const exitT = Math.max(0, Math.min(1, (-sectionHeight * 0.70 - liveSectionTop) / (-sectionHeight * 0.70 - exitEnd)));
            ctaImageWrapper.style.opacity = String(Math.max(0, 1 - exitT));
          } else {
            ctaImageWrapper.style.opacity = '1';
          }
        }
      };

      const applyCaseCardRotations = (p: number) => {
        if (!caseSection) return;
        const isDesktop = window.innerWidth >= 992;

        if (!isDesktop) {
          if (wrap1) wrap1.style.transform = 'none';
          if (wrap2) wrap2.style.transform = 'none';
          if (wrap3) wrap3.style.transform = 'none';
          if (wrap4) wrap4.style.transform = 'none';
          return;
        }

        const pct = p * 100;

        // wrap-1: 0% -> 0°, 18% -> -12°, 82% -> 12°
        const rot1 = pct < 18
          ? interpolate(pct, 0, 0, 18, -12)
          : interpolate(pct, 18, -12, 82, 12);

        // wrap-2: 0% -> 0°, 20% -> 12°, 82% -> -12°
        const rot2 = pct < 20
          ? interpolate(pct, 0, 0, 20, 12)
          : interpolate(pct, 20, 12, 82, -12);

        // wrap-3: 0% -> 0°, 39% -> -12°, 88% -> 12°
        const rot3 = pct < 39
          ? interpolate(pct, 0, 0, 39, -12)
          : interpolate(pct, 39, -12, 88, 12);

        // wrap-4: 0% -> 0°, 55% -> 12°, 88% -> -12°
        const rot4 = pct < 55
          ? interpolate(pct, 0, 0, 55, 12)
          : interpolate(pct, 55, 12, 88, -12);

        if (wrap1) wrap1.style.transform = `rotate(${rot1.toFixed(2)}deg)`;
        if (wrap2) wrap2.style.transform = `rotate(${rot2.toFixed(2)}deg)`;
        if (wrap3) wrap3.style.transform = `rotate(${rot3.toFixed(2)}deg)`;
        if (wrap4) wrap4.style.transform = `rotate(${rot4.toFixed(2)}deg)`;
      };

      let rafPending = false;

      const renderFrame = () => {
        rafPending = false;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const viewportHeight = window.innerHeight;
        const isDesktop = window.innerWidth >= 992;

        // 1. CTA Section (Secret Universe)
        if (ctaSection) {
          const liveCtaTop = cachedFrameTop + cachedCtaTop - scrollY;
          const spinStart = viewportHeight + 60;
          const splitEnd = viewportHeight * 0.20;

          let targetP = 0;
          if (liveCtaTop < spinStart && liveCtaTop > splitEnd) {
            targetP = (spinStart - liveCtaTop) / (spinStart - splitEnd);
          } else if (liveCtaTop <= splitEnd) {
            targetP = 1;
          }

          const diffCta = targetP - ctaCurrentProgress;
          if (Math.abs(diffCta) < 0.003) {
            ctaCurrentProgress = targetP;
          } else {
            ctaCurrentProgress += diffCta * 0.18;
          }
          applyCtaStyles(ctaCurrentProgress, liveCtaTop);
        }

        // 2. Case Studies Section (sticky marquee qua JS + card rotation)
        if (caseSection) {
          const liveCaseTop = cachedFrameTop + cachedCaseTop - scrollY;

          if (!isDesktop) {
            if (stickyBlock) stickyBlock.style.transform = 'translate3d(0,0,0)';
            if (wrap1) wrap1.style.transform = 'none';
            if (wrap2) wrap2.style.transform = 'none';
            if (wrap3) wrap3.style.transform = 'none';
            if (wrap4) wrap4.style.transform = 'none';
          } else {
            // 2a. Sticky marquee qua JS translate3d
            // (CSS position:sticky không hoạt động trong iframe không scroll)
            // stickyBlock có will-change:transform + contain:layout → compositing layer riêng
            // → marquee CSS animation bên trong không bị repaint khi stickyY thay đổi
            const liveBlockTop = liveCaseTop + cachedStickyOffsetTop;
            const targetStickyTop = 100; // px từ top viewport
            const maxStickyY = Math.max(0, cachedCaseHeight - cachedStickyOffsetTop - cachedStickyHeight - 50);

            let stickyY = 0;
            if (liveBlockTop <= targetStickyTop) {
              stickyY = Math.min(maxStickyY, targetStickyTop - liveBlockTop);
            }

            // Snap về 0 khi stickyY cực nhỏ để tránh sub-pixel jitter
            if (stickyY < 0.5) stickyY = 0;

            if (stickyBlock) {
              stickyBlock.style.transform = `translate3d(0,${Math.round(stickyY)}px,0)`;
            }

            // 2b. Card rotation theo scroll progress
            const totalTravel = viewportHeight + cachedCaseHeight;
            const rawProgress = totalTravel > 0 ? (viewportHeight - liveCaseTop) / totalTravel : 0;
            const targetProgress = Math.max(0, Math.min(1, rawProgress));

            const diffCase = targetProgress - caseCurrentProgress;
            if (Math.abs(diffCase) < 0.003) {
              caseCurrentProgress = targetProgress;
            } else {
              caseCurrentProgress += diffCase * 0.20;
            }
            applyCaseCardRotations(caseCurrentProgress);
          }
        }

        // Tiếp tục lặp nếu các animation chưa hội tụ
        if (Math.abs(ctaTargetProgress - ctaCurrentProgress) > 0.003 || Math.abs(caseTargetProgress - caseCurrentProgress) > 0.003) {
          if (!rafPending) {
            rafPending = true;
            animationFrame = window.requestAnimationFrame(renderFrame);
          }
        }
      };

      const onScrollOrResize = () => {
        if (!rafPending) {
          rafPending = true;
          animationFrame = window.requestAnimationFrame(renderFrame);
        }
      };

      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', () => {
        measureLayout();
        onScrollOrResize();
      }, { passive: true });

      cleanupListeners = () => {
        window.removeEventListener('scroll', onScrollOrResize);
        window.removeEventListener('resize', onScrollOrResize);
      };

      // Khởi tạo tức thì
      onScrollOrResize();
      window.setTimeout(() => {
        measureLayout();
        onScrollOrResize();
      }, 500);

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
        key="astrica-home-frame-v8"
        src="/astrica/reference-home.html?v=20261109_08"
        title="Các section trang chủ tham khảo Astrica"
        loading="eager"
        scrolling="no"
      />
    </section>
  );
}
