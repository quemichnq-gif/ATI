(function () {
  var ZODIAC_INFO = {
    aries: {
      nameVi: 'Bạch Dương',
      nameEn: 'Aries',
      symbol: '♈',
      element: 'Nguyên tố Lửa',
      quality: 'Tiên phong',
      ruler: 'Sao Hỏa',
      summary: 'Biểu trưng cho năng lượng khởi đầu mãnh liệt, lòng can đảm và tinh thần tiên phong. Luôn chủ động, nhiệt huyết và quyết đoán trước mọi thử thách.'
    },
    taurus: {
      nameVi: 'Kim Ngưu',
      nameEn: 'Taurus',
      symbol: '♉',
      element: 'Nguyên tố Đất',
      quality: 'Kiên định',
      ruler: 'Sao Kim',
      summary: 'Mang nguồn năng lượng điềm tĩnh, vững chãi, thực tế và yêu chuộng vẻ đẹp hài hòa. Đem lại sự tin cậy tuyệt đối và khả năng xây dựng nền tảng bền lâu.'
    },
    gemini: {
      nameVi: 'Song Tử',
      nameEn: 'Gemini',
      symbol: '♊',
      element: 'Nguyên tố Khí',
      quality: 'Biến đổi',
      ruler: 'Sao Thủy',
      summary: 'Biểu tượng của trí tuệ linh hoạt, giao tiếp duyên dáng và trí tò mò bất tận. Kết nối thông minh, thích ứng nhanh và luôn tràn ngập ý tưởng mới mẻ.'
    },
    cancer: {
      nameVi: 'Cự Giải',
      nameEn: 'Cancer',
      symbol: '♋',
      element: 'Nguyên tố Thủy',
      quality: 'Tiên phong',
      ruler: 'Mặt Trăng',
      summary: 'Giàu cảm xúc, trực giác nhạy bén và mang bản năng chở che sâu sắc. Là bến đỗ an lành với khả năng thấu cảm và nuôi dưỡng tinh thần kỳ diệu.'
    },
    leo: {
      nameVi: 'Sư Tử',
      nameEn: 'Leo',
      symbol: '♌',
      element: 'Nguyên tố Lửa',
      quality: 'Kiên định',
      ruler: 'Mặt Trời',
      summary: 'Hào quang rực rỡ, phong thái tự tin, trái tim ấm áp và tinh thần hào phóng. Lan tỏa nguồn cảm hứng sống tích cực và dẫn dắt bằng sự chân thành.'
    },
    virgo: {
      nameVi: 'Xử Nữ',
      nameEn: 'Virgo',
      symbol: '♍',
      element: 'Nguyên tố Đất',
      quality: 'Biến đổi',
      ruler: 'Sao Thủy',
      summary: 'Năng lực quan sát tinh tế, tư duy logic sắc bén và sự chu đáo tận tâm. Luôn tỉ mỉ hoàn thiện mọi điều và mang đến trật tự, bình yên tinh tế.'
    },
    libra: {
      nameVi: 'Thiên Bình',
      nameEn: 'Libra',
      symbol: '♎',
      element: 'Nguyên tố Khí',
      quality: 'Tiên phong',
      ruler: 'Sao Kim',
      summary: 'Đại diện cho sự công bằng, phong thái thanh lịch và khát vọng hòa hợp. Luôn tìm kiếm sự cân bằng hoàn hảo trong tâm hồn và các mối nhân duyên.'
    },
    scorpio: {
      nameVi: 'Bọ Cạp',
      nameEn: 'Scorpio',
      symbol: '♏',
      element: 'Nguyên tố Thủy',
      quality: 'Kiên định',
      ruler: 'Sao Diêm Vương',
      summary: 'Chiều sâu nội tâm huyền bí, trực giác thấu thị và sức mạnh tái sinh mãnh liệt. Bản lĩnh kiên cường, trung thành son sắt và gắn kết vô cùng bền chặt.'
    },
    sagittarius: {
      nameVi: 'Nhân Mã',
      nameEn: 'Sagittarius',
      symbol: '♐',
      element: 'Nguyên tố Lửa',
      quality: 'Biến đổi',
      ruler: 'Sao Mộc',
      summary: 'Tâm hồn tự do, tầm nhìn rộng mở, tinh thần lạc quan và khát khao tri thức vô tận. Luôn tràn đầy niềm vui phiêu lưu và truyền cảm hứng khám phá.'
    },
    capricorn: {
      nameVi: 'Ma Kết',
      nameEn: 'Capricorn',
      symbol: '♑',
      element: 'Nguyên tố Đất',
      quality: 'Tiên phong',
      ruler: 'Sao Thổ',
      summary: 'Kỷ luật, kiên định, bản lĩnh vững vàng và tinh thần trách nhiệm cao. Từng bước chắc chắn kiến tạo thành công và làm chủ vận mệnh tương lai.'
    },
    aquarius: {
      nameVi: 'Bảo Bình',
      nameEn: 'Aquarius',
      symbol: '♒',
      element: 'Nguyên tố Khí',
      quality: 'Kiên định',
      ruler: 'Sao Thiên Vương',
      summary: 'Tư duy độc bản, tầm nhìn tiến bộ vượt thời đại và lý tưởng nhân văn cao đẹp. Đột phá mọi giới hạn khuôn mẫu với sự sáng tạo khác biệt và tự do.'
    },
    pisces: {
      nameVi: 'Song Ngư',
      nameEn: 'Pisces',
      symbol: '♓',
      element: 'Nguyên tố Thủy',
      quality: 'Biến đổi',
      ruler: 'Sao Hải Vương',
      summary: 'Tâm hồn lãng mạn, lòng trắc ẩn bao dung và khả năng kết nối tâm linh huyền bí. Cảm thụ nghệ thuật nhạy bén và mang lại tình yêu thương chữa lành sâu sắc.'
    }
  };

  function extractSignKey(card) {
    if (!card) return null;
    var href = card.getAttribute('href') || '';
    var match = href.match(/\/horoscope\/([a-z]+)/i);
    if (match && match[1]) return match[1].toLowerCase();

    var titleEl = card.querySelector('.horoscope-item-title');
    if (titleEl && titleEl.textContent) {
      var t = titleEl.textContent.trim().toLowerCase();
      if (ZODIAC_INFO[t]) return t;
    }

    var icon = card.querySelector('.horoscope-icon-image');
    if (icon && icon.getAttribute('src')) {
      var src = icon.getAttribute('src');
      var m = src.match(/\d+-([a-z]+)\.svg/i);
      if (m && m[1]) return m[1].toLowerCase();
    }
    return null;
  }

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

    // 2. Clone 12 slides để tạo chuỗi 24 slides liền mạch trôi liên tục
    originalSlides.forEach(function (slide) {
      var clone = slide.cloneNode(true);
      clone.classList.add('is-clone');
      track.appendChild(clone);
    });

    track.style.transition = 'none';
    track.style.willChange = 'transform';

    var currentX = 0;
    var speed = 0.9; // Tốc độ trôi êm ái
    var isPaused = false;
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
      if (!isPaused && singleSetWidth > 0) {
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

    // 3. Khởi tạo cửa sổ nổi giải thích cung hoàng đạo (Cosmic Zodiac Popover)
    var popover = doc.querySelector('.zodiac-popover-box');
    if (!popover) {
      popover = doc.createElement('div');
      popover.className = 'zodiac-popover-box';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-modal', 'false');
      doc.body.appendChild(popover);
    }

    var isPinned = false;
    var pinnedCard = null;
    var hoverTimeout = null;
    var isMouseOverPopover = false;
    var currentCard = null;

    function positionPopover(card) {
      if (!card || !popover) return;
      var rect = card.getBoundingClientRect();
      var popoverWidth = Math.min(360, window.innerWidth - 32);
      popover.style.width = popoverWidth + 'px';

      var cardCenterX = rect.left + rect.width / 2;
      var left = Math.max(popoverWidth / 2 + 16, Math.min(cardCenterX, window.innerWidth - popoverWidth / 2 - 16));
      popover.style.left = left + 'px';

      var popoverHeight = popover.offsetHeight || 230;
      var scrollY = window.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop || 0;

      if (rect.top >= popoverHeight + 16) {
        popover.style.top = (rect.top + scrollY - popoverHeight - 12) + 'px';
      } else {
        popover.style.top = (rect.bottom + scrollY + 12) + 'px';
      }
    }

    function showPopover(card, signKey, pinned) {
      var info = ZODIAC_INFO[signKey];
      if (!info) return;

      currentCard = card;

      popover.innerHTML = [
        '<div class="zodiac-popover-header">',
        '  <div class="zodiac-popover-title-wrap">',
        '    <span class="zodiac-popover-symbol">' + info.symbol + '</span>',
        '    <div>',
        '      <div class="zodiac-popover-name-vi">' + info.nameVi + ' <span class="zodiac-popover-name-en">(' + info.nameEn + ')</span></div>',
        '    </div>',
        '  </div>',
        '  <button type="button" class="zodiac-popover-close" aria-label="Đóng cửa sổ nổi">✕</button>',
        '</div>',
        '<div class="zodiac-popover-tags">',
        '  <span class="zodiac-popover-tag tag-element">' + info.element + '</span>',
        '  <span class="zodiac-popover-tag">' + info.quality + '</span>',
        '  <span class="zodiac-popover-tag">Chủ quản: ' + info.ruler + '</span>',
        pinned ? '  <span class="zodiac-popover-tag tag-pin">📌 Cố định</span>' : '',
        '</div>',
        '<div class="zodiac-popover-desc">' + info.summary + '</div>',
        '<button type="button" class="zodiac-popover-btn">',
        '  <span>Chi tiết với AI ✨</span>',
        '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>',
        '</button>'
      ].join('');

      var closeBtn = popover.querySelector('.zodiac-popover-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          unpinAndHide();
        });
      }

      var aiBtn = popover.querySelector('.zodiac-popover-btn');
      if (aiBtn) {
        aiBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          unpinAndHide();
          navigateToAssistant(info.nameVi, info.nameEn);
        });
      }

      if (pinned) {
        popover.classList.add('is-pinned');
        if (pinnedCard) pinnedCard.classList.remove('is-pinned');
        card.classList.add('is-pinned');
      } else {
        popover.classList.remove('is-pinned');
      }

      popover.style.display = 'block';
      positionPopover(card);
      requestAnimationFrame(function () {
        popover.classList.add('is-visible');
      });
    }

    function hidePopover() {
      popover.classList.remove('is-visible');
      popover.classList.remove('is-pinned');
      if (pinnedCard) {
        pinnedCard.classList.remove('is-pinned');
        pinnedCard = null;
      }
      setTimeout(function () {
        if (!popover.classList.contains('is-visible')) {
          popover.style.display = 'none';
        }
      }, 220);
    }

    function unpinAndHide() {
      isPinned = false;
      isMouseOverPopover = false;
      hidePopover();
      isPaused = false;
    }

    function navigateToAssistant(nameVi, nameEn) {
      var destination = '/assistant';
      try {
        if (window.parent && window.parent.__navigate) {
          window.parent.__navigate(destination, {
            state: { initialPrompt: 'Hãy giải thích chi tiết và phân tích sâu về cung ' + nameVi + ' (' + nameEn + ')' }
          });
          return;
        }
      } catch (e) {}

      try {
        if (window.parent && window.parent !== window) {
          window.parent.location.assign(destination);
          return;
        }
      } catch (e) {}

      window.location.assign(destination);
    }

    // Gắn sự kiện cho popover khi chuột rê vào
    popover.addEventListener('mouseenter', function () {
      isMouseOverPopover = true;
      if (hoverTimeout) clearTimeout(hoverTimeout);
      isPaused = true;
    });

    popover.addEventListener('mouseleave', function () {
      isMouseOverPopover = false;
      if (!isPinned) {
        hoverTimeout = setTimeout(function () {
          if (!isPinned) {
            hidePopover();
            isPaused = false;
          }
        }, 180);
      }
    });

    // 4. Gắn sự kiện Click & Hover cho từng thẻ cung hoàng đạo
    var allCards = track.querySelectorAll('.horoscope-item-block');
    allCards.forEach(function (card) {
      // Vô hiệu hóa link chuyển hướng cũ và gắn logic popup
      card.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var signKey = extractSignKey(card);
        if (!signKey || !ZODIAC_INFO[signKey]) return;

        // Bấm lần nữa vào thẻ đang ghim thì đóng lại
        if (isPinned && pinnedCard === card) {
          unpinAndHide();
        } else {
          isPinned = true;
          pinnedCard = card;
          isPaused = true;
          showPopover(card, signKey, true);
        }
      });

      card.addEventListener('mouseenter', function () {
        isPaused = true;
        if (isPinned) return;
        if (hoverTimeout) clearTimeout(hoverTimeout);

        var signKey = extractSignKey(card);
        if (!signKey || !ZODIAC_INFO[signKey]) return;

        showPopover(card, signKey, false);
      });

      card.addEventListener('mouseleave', function () {
        if (isPinned) return;
        if (hoverTimeout) clearTimeout(hoverTimeout);

        hoverTimeout = setTimeout(function () {
          if (!isPinned && !isMouseOverPopover) {
            hidePopover();
            isPaused = false;
          }
        }, 180);
      });
    });

    // 5. Đóng khi click ra ngoài thẻ và ngoài cửa sổ nổi
    doc.addEventListener('click', function (e) {
      if (isPinned) {
        if (!popover.contains(e.target) && !e.target.closest('.horoscope-item-block')) {
          unpinAndHide();
        }
      }
    });

    // Cập nhật vị trí popover khi cuộn hoặc đổi kích thước cửa sổ
    window.addEventListener('resize', function () {
      if (popover && popover.classList.contains('is-visible') && currentCard) {
        positionPopover(currentCard);
      }
    });

    window.addEventListener('scroll', function () {
      if (popover && popover.classList.contains('is-visible') && currentCard) {
        positionPopover(currentCard);
      }
    }, { passive: true });

    // Ẩn tab tự động tạm dừng
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        isPaused = true;
      } else if (!isPinned) {
        isPaused = false;
      }
    });
  }

  window.setupHoroscopeMarquee = setupHoroscopeMarquee;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupHoroscopeMarquee(document);
    }, { once: true });
  } else {
    setupHoroscopeMarquee(document);
  }
})();
