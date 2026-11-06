(function () {
  function setupHoroscopeCarousels() {
    document.querySelectorAll('.horoscope-slider').forEach(function (slider) {
      var track = slider.querySelector('.horoscope-slider-mask');
      var previous = slider.querySelector('.horoscope-3-left');
      var next = slider.querySelector('.horoscope-3-right');
      var slides = track ? Array.from(track.children).filter(function (slide) {
        return slide.classList.contains('horoscope-slide');
      }) : [];

      if (!track || !previous || !next || slides.length === 0) return;

      var index = 0;
      var visibleCount = function () {
        return parseInt(getComputedStyle(slider).getPropertyValue('--horoscope-visible'), 10) || 4;
      };
      var lastIndex = function () {
        return Math.max(0, slides.length - visibleCount());
      };
      var render = function () {
        var visible = visibleCount();
        index = Math.min(index, lastIndex());
        track.style.transform = 'translate3d(-' + (index * 100 / visible) + '%, 0, 0)';
        slides.forEach(function (slide, slideIndex) {
          slide.setAttribute('aria-label', (slideIndex + 1) + ' of ' + slides.length);
          var hidden = slideIndex < index || slideIndex >= index + visible;
          slide.setAttribute('aria-hidden', String(hidden));
          slide.inert = hidden;
        });
      };

      previous.addEventListener('click', function () {
        index = index === 0 ? lastIndex() : index - 1;
        render();
      });
      next.addEventListener('click', function () {
        index = index === lastIndex() ? 0 : index + 1;
        render();
      });
      window.addEventListener('resize', render);
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHoroscopeCarousels, { once: true });
  } else {
    setupHoroscopeCarousels();
  }
})();
