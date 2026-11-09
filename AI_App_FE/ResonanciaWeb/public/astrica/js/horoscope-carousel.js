(function () {
  function setupHoroscopeMarquee(rootDoc) {
    var doc = rootDoc || document;
    var slider = doc.querySelector('.horoscope-slider');
    if (!slider || slider.dataset.horoscopeMarqueeInit === 'true') return;

    var track = slider.querySelector('.horoscope-slider-mask');
    if (!track) return;

    var originalSlides = Array.from(track.children).filter(function (s) {
      return s.classList.contains('horoscope-slide') && !s.classList.contains('is-clone');
    });
    var totalOriginal = originalSlides.length;
    if (totalOriginal === 0) return;

    slider.dataset.horoscopeMarqueeInit = 'true';

    // 1. Dọn dẹp bản sao cũ nếu có
    Array.from(track.children).forEach(function (child) {
      if (child.classList.contains('is-clone')) {
        child.remove();
      }
    });

    // 2. Clone 12 slides để tạo chuỗi 24 slides liền mạch không gián đoạn
    originalSlides.forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.classList.add('is-clone');
      track.appendChild(clone);
    });

    // Tắt transition mặc định trên track để animation qua requestAnimationFrame trôi mượt mà 60fps
    track.style.transition = 'none';
    track.style.willChange = 'transform';

    var currentX = 0;
    var speed = 0.9; // Tốc độ trôi tự nhiên, êm dịu (~54px/s)
    var isPaused = false;
    var isNudging = false;
    var nudgeTimer = null;
    var singleSetWidth = 0;

    var updateMetrics = function () {
      var first = originalSlides[0];
      var last = originalSlides[originalSlides.length - 1];
      if (first && last && last.offsetLeft > first.offsetLeft) {
        singleSetWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      } else {
        var visible = parseInt(getComputedStyle(slider).getPropertyValue('--horoscope-visible'), 10) || 4;
        var w = slider.clientWidth || 1200;
        singleSetWidth = (w / visible) * totalOriginal;
      }
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    setTimeout(updateMetrics, 300);
    setTimeout(updateMetrics, 1000);

    // Vòng lặp chuyển động mượt mà liên tục (Smooth Loop)
    function tick() {
      if (!isPaused && !isNudging && singleSetWidth > 0) {
        currentX += speed;
        if (currentX >= singleSetWidth) {
          currentX -= singleSetWidth;
        } else if (currentX < 0) {
          currentX += singleSetWidth;
        }
        track.style.transform = 'translate3d(-' + currentX + 'px, 0, 0)';
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // 3. Tương tác: khi hover đến hình thì loop dừng lại, thả chuột ra ngoài thì tiếp tục chạy
    track.addEventListener('mouseenter', function () {
      isPaused = true;
    });
    track.addEventListener('mouseleave', function () {
      isPaused = false;
    });

    track.querySelectorAll('.horoscope-slide, .horoscope-item-block').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        isPaused = true;
      });
      el.addEventListener('mouseleave', function () {
        isPaused = false;
      });
    });

    // 4. Các nút điều hướng Prev / Next: dịch chuyển 1 ô mượt mà
    var previous = slider.querySelector('.horoscope-3-left');
    var next = slider.querySelector('.horoscope-3-right');

    var getSlideWidth = function () {
      var visible = parseInt(getComputedStyle(slider).getPropertyValue('--horoscope-visible'), 10) || 4;
      return (slider.clientWidth || 1200) / visible;
    };

    function applyNudge(delta) {
      if (singleSetWidth <= 0) updateMetrics();
      isNudging = true;
      if (nudgeTimer) clearTimeout(nudgeTimer);

      track.style.transition = 'transform 380ms cubic-bezier(0.25, 1, 0.5, 1)';
      currentX += delta;
      if (currentX >= singleSetWidth) {
        currentX -= singleSetWidth;
      } else if (currentX < 0) {
        currentX += singleSetWidth;
      }
      track.style.transform = 'translate3d(-' + currentX + 'px, 0, 0)';

      nudgeTimer = setTimeout(function () {
        track.style.transition = 'none';
        isNudging = false;
      }, 400);
    }

    if (next) {
      next.addEventListener('click', function (e) {
        e.preventDefault();
        applyNudge(getSlideWidth());
      });
    }

    if (previous) {
      previous.addEventListener('click', function (e) {
        e.preventDefault();
        applyNudge(-getSlideWidth());
      });
    }

    // Xử lý ẩn tab
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
      }
    });
  }

  // Expose ra window để có thể gọi trực tiếp từ iframe parent nếu cần
  window.setupHoroscopeMarquee = setupHoroscopeMarquee;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupHoroscopeMarquee(document);
    }, { once: true });
  } else {
    setupHoroscopeMarquee(document);
  }
})();
