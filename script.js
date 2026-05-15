'use strict';

function throttle(fn, ms) {
  ms = ms || 100;
  var last = 0;
  return function() {
    var now = Date.now();
    if (now - last >= ms) { last = now; fn.apply(this, arguments); }
  };
}

(function initStickyHeader() {
  var sticky = document.getElementById('stickyHeader');
  var hero   = document.getElementById('hero');
  if (!sticky || !hero) return;

  function onScroll() {
    var y       = window.scrollY || window.pageYOffset;
    var heroEnd = hero.offsetTop + hero.offsetHeight;
    if (y > heroEnd) {
      sticky.classList.add('is-visible');
      sticky.setAttribute('aria-hidden', 'false');
    } else {
      sticky.classList.remove('is-visible');
      sticky.setAttribute('aria-hidden', 'true');
    }
  }

  window.addEventListener('scroll', throttle(onScroll, 60), { passive: true });
  onScroll();
})();

(function initHamburger() {
  var btn   = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', function() {
    var open = btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    if (open) {
      links.style.cssText = [
        'display:flex','flex-direction:column','position:fixed',
        'top:60px','left:0','right:0','background:#fff',
        'padding:16px 24px','box-shadow:0 8px 24px rgba(0,0,0,.12)',
        'z-index:99','gap:4px','border-top:1px solid #e5e7eb'
      ].join(';');
    } else {
      links.removeAttribute('style');
    }
  });

  document.addEventListener('click', function(e) {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      links.removeAttribute('style');
    }
  });
})();

(function initGallery() {
  var mainImg   = document.getElementById('mainImg');
  var thumbWrap = document.getElementById('galleryThumbs');
  var prevBtn   = document.getElementById('galleryPrev');
  var nextBtn   = document.getElementById('galleryNext');
  if (!mainImg || !thumbWrap) return;

  var thumbs  = Array.from(thumbWrap.querySelectorAll('.thumb'));
  var current = 0;

  function activate(idx) {
    current = (idx + thumbs.length) % thumbs.length;
    var src = thumbs[current].dataset.src;
    mainImg.style.opacity = '0';
    setTimeout(function() {
      mainImg.src           = src;
      mainImg.style.opacity = '1';
      updateZoomBg(src);
    }, 180);
    thumbs.forEach(function(t, i) { t.classList.toggle('active', i === current); });
  }

  thumbs.forEach(function(t, i) {
    t.addEventListener('click', function() { activate(i); });
  });

  if (prevBtn) prevBtn.addEventListener('click', function() { activate(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { activate(current + 1); });

  window._galleryGetSrc = function() { return thumbs[current].dataset.src; };
})();

(function initZoom() {
  var wrap    = document.getElementById('galleryMain');
  var mainImg = document.getElementById('mainImg');
  var lens    = document.getElementById('zoomLens');
  var result  = document.getElementById('zoomResult');
  if (!wrap || !mainImg || !lens || !result) return;

  var ZOOM  = 2.5;
  var LSIZE = 100;

  window.updateZoomBg = function(src) {
    result.style.backgroundImage = 'url(' + src + ')';
  };
  updateZoomBg(mainImg.src);

  lens.style.width  = LSIZE + 'px';
  lens.style.height = LSIZE + 'px';
  lens.style.cursor = 'crosshair';

  function refreshResultSize() {
    result.style.width  = LSIZE * ZOOM + 'px';
    result.style.height = LSIZE * ZOOM + 'px';
    result.style.backgroundSize =
      (mainImg.offsetWidth * ZOOM) + 'px ' + (mainImg.offsetHeight * ZOOM) + 'px';
  }
  refreshResultSize();

  function getCursorPos(e) {
    var rect = mainImg.getBoundingClientRect();
    var cx = e.touches ? e.touches[0].clientX : e.clientX;
    var cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }

  function moveLens(e) {
    e.preventDefault();
    var pos = getCursorPos(e);
    var lx  = Math.max(0, Math.min(pos.x - LSIZE / 2, mainImg.offsetWidth  - LSIZE));
    var ly  = Math.max(0, Math.min(pos.y - LSIZE / 2, mainImg.offsetHeight - LSIZE));
    lens.style.left = lx + 'px';
    lens.style.top  = ly + 'px';
    result.style.backgroundPositionX = '-' + (lx * ZOOM) + 'px';
    result.style.backgroundPositionY = '-' + (ly * ZOOM) + 'px';
  }

  function show() {
    updateZoomBg(mainImg.src);
    refreshResultSize();
    lens.style.opacity      = '1';
    result.style.opacity    = '1';
    result.style.visibility = 'visible';
    wrap.classList.add('zooming');
  }

  function hide() {
    lens.style.opacity      = '0';
    result.style.opacity    = '0';
    result.style.visibility = 'hidden';
    wrap.classList.remove('zooming');
  }

  if (!('ontouchstart' in window)) {
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mouseleave', hide);
    wrap.addEventListener('mousemove',  moveLens);
  }

  window.addEventListener('resize', throttle(refreshResultSize, 200));
})();

(function initAppCarousel() {
  var track   = document.getElementById('appTrack');
  var prevBtn = document.getElementById('appPrev');
  var nextBtn = document.getElementById('appNext');
  if (!track) return;

  var slides  = Array.from(track.querySelectorAll('.app-slide'));
  var current = 0;
  var visible = getVisible();

  function getVisible() {
    if (window.innerWidth <= 480)  return 1;
    if (window.innerWidth <= 768)  return 1.5;
    if (window.innerWidth <= 1024) return 2.5;
    return 3.5;
  }

  function getSlideWidth() {
    return slides[0] ? slides[0].offsetWidth + 20 : 260;
  }

  function goTo(idx) {
    var max = Math.max(0, slides.length - Math.floor(visible));
    current = Math.max(0, Math.min(idx, max));
    track.style.transform = 'translateX(-' + (current * getSlideWidth()) + 'px)';
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current >= max;
  }

  if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

  window.addEventListener('resize', throttle(function() {
    visible = getVisible();
    goTo(current);
  }, 200));

  goTo(0);

  var touchStartX = 0;
  track.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? goTo(current + 1) : goTo(current - 1);
  }, { passive: true });
})();

(function initFAQ() {
  var items = Array.from(document.querySelectorAll('.faq-item'));
  items.forEach(function(item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var isOpen = item.classList.contains('open');
      items.forEach(function(i) {
        i.classList.remove('open');
        var q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

(function initProcessTabs() {
  var tabBtns = Array.from(document.querySelectorAll('.process-tab'));
  var panels  = Array.from(document.querySelectorAll('.process-panel'));
  var prevBtn = document.getElementById('procPrev');
  var nextBtn = document.getElementById('procNext');
  var total   = tabBtns.length;
  var current = 0;

  if (!tabBtns.length) return;

  function goToStep(idx) {
    if (idx < 0 || idx >= total) return;
    current = idx;
    tabBtns.forEach(function(b, i) {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-selected', String(i === idx));
    });
    panels.forEach(function(p) { p.classList.remove('active'); });
    var target = document.querySelector('[data-panel="' + idx + '"]');
    if (target) target.classList.add('active');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      goToStep(parseInt(btn.dataset.tab, 10));
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', function() { goToStep(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToStep(current + 1); });

  goToStep(0);
})();

function openModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  var focusable = overlay.querySelectorAll('input,button,select,textarea,a[href]');
  if (focusable.length) focusable[0].focus();
}

function closeModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
      closeModal(m.id);
    });
  }
});

(function() {
  var form = document.getElementById('catalogueForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('catEmail');
    if (!email || !isValidEmail(email.value.trim())) { shakeInput(email); return; }
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ Catalogue sent to your email!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function() { closeModal('catalogueModal'); resetBtn(btn, 'Submit Form'); }, 2200);
  });
})();

(function() {
  var form = document.getElementById('callbackForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name  = document.getElementById('cbName');
    var email = document.getElementById('cbEmail');
    if (!name || !name.value.trim()) { shakeInput(name); return; }
    if (!email || !isValidEmail(email.value.trim())) { shakeInput(email); return; }
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ We\'ll call you back shortly!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function() { closeModal('callbackModal'); resetBtn(btn, 'Submit Form'); }, 2200);
  });
})();

(function() {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ Message sent!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function() { resetBtn(btn, 'Request Custom Quote'); }, 3000);
  });
})();

function handleCatalogueEmail(btn) {
  var input = btn.previousElementSibling;
  if (!input) return;
  if (!isValidEmail(input.value.trim())) { shakeInput(input); return; }
  btn.textContent = '✓ Sent!';
  btn.style.background = '#16a34a';
  btn.disabled = true;
  input.value = '';
  input.placeholder = "We'll be in touch shortly!";
  setTimeout(function() { resetBtn(btn, 'Request Catalogue'); }, 3000);
}

(function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var style = document.createElement('style');
  style.textContent =
    '.fade-up{opacity:0;transform:translateY(28px);transition:opacity .55s ease,transform .55s ease;}' +
    '.fade-up.in{opacity:1;transform:translateY(0);}';
  document.head.appendChild(style);
  var targets = document.querySelectorAll(
    '.feature-card,.portfolio-card,.testi-card,.faq-item,.resource-row,.cert-badge'
  );
  targets.forEach(function(el, i) {
    el.classList.add('fade-up');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
  });
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(function(el) { observer.observe(el); });
})();

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function shakeInput(el) {
  if (!el) return;
  el.style.borderColor = '#ef4444';
  el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.15)';
  el.focus();
  setTimeout(function() { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
}

function resetBtn(btn, label) {
  btn.textContent      = label;
  btn.style.background = '';
  btn.disabled         = false;
}

(function initHamburger() {
  var btn   = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  var cta   = document.querySelector('.nav-cta-btn');
  if (!btn || !links) return;

  btn.addEventListener('click', function () {
    var open = btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);

    if (open) {
      links.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'position:fixed',
        'top:60px',
        'left:0',
        'right:0',
        'background:#fff',
        'padding:16px 24px',
        'box-shadow:0 8px 24px rgba(0,0,0,.12)',
        'z-index:99',
        'gap:4px',
        'border-top:1px solid #e5e7eb'
      ].join(';');
    } else {
      links.removeAttribute('style');
    }
  });

  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) && !links.contains(e.target)) {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      links.removeAttribute('style');
    }
  });
})();


(function initGallery() {
  var mainImg   = document.getElementById('mainImg');
  var thumbWrap = document.getElementById('galleryThumbs');
  var prevBtn   = document.getElementById('galleryPrev');
  var nextBtn   = document.getElementById('galleryNext');
  if (!mainImg || !thumbWrap) return;

  var thumbs = Array.from(thumbWrap.querySelectorAll('.thumb'));
  var current = 0;

  function activate(idx) {
    current = (idx + thumbs.length) % thumbs.length;
    var src = thumbs[current].dataset.src;

    mainImg.style.transition = 'opacity .2s ease';
    mainImg.style.opacity    = '0';
    setTimeout(function () {
      mainImg.src           = src;
      mainImg.style.opacity = '1';
      updateZoomBg(src);
    }, 180);

    thumbs.forEach(function (t, i) {
      t.classList.toggle('active', i === current);
    });
  }

  thumbs.forEach(function (t, i) {
    t.addEventListener('click', function () { activate(i); });
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { activate(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { activate(current + 1); });

  window._galleryGetSrc = function () { return thumbs[current].dataset.src; };
})();

(function initZoom() {
  var wrap   = document.getElementById('galleryMain');
  var mainImg = document.getElementById('mainImg');
  var lens   = document.getElementById('zoomLens');
  var result = document.getElementById('zoomResult');
  if (!wrap || !mainImg || !lens || !result) return;

  var ZOOM   = 2.5;          /* zoom factor */
  var LSIZE  = 100;          /* lens width & height in px */
  var active = false;

  window.updateZoomBg = function (src) {
    result.style.backgroundImage = 'url(' + src + ')';
  };
  updateZoomBg(mainImg.src);

  lens.style.width  = LSIZE + 'px';
  lens.style.height = LSIZE + 'px';
  lens.style.cursor = 'crosshair';

  result.style.width  = LSIZE * ZOOM + 'px';
  result.style.height = LSIZE * ZOOM + 'px';
  result.style.backgroundSize =
    (mainImg.offsetWidth * ZOOM) + 'px ' + (mainImg.offsetHeight * ZOOM) + 'px';

  function getCursorPos(e) {
    var rect = mainImg.getBoundingClientRect();
    var pageX = e.touches ? e.touches[0].clientX : e.clientX;
    var pageY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: pageX - rect.left,
      y: pageY - rect.top
    };
  }

  function moveLens(e) {
    e.preventDefault();
    var pos = getCursorPos(e);

    var lx = pos.x - LSIZE / 2;
    var ly = pos.y - LSIZE / 2;
    lx = Math.max(0, Math.min(lx, mainImg.offsetWidth  - LSIZE));
    ly = Math.max(0, Math.min(ly, mainImg.offsetHeight - LSIZE));

    lens.style.left = lx + 'px';
    lens.style.top  = ly + 'px';

    result.style.backgroundPositionX = '-' + (lx * ZOOM) + 'px';
    result.style.backgroundPositionY = '-' + (ly * ZOOM) + 'px';
  }

  function show() {
    active = true;
    updateZoomBg(mainImg.src);
    result.style.backgroundSize =
      (mainImg.offsetWidth * ZOOM) + 'px ' + (mainImg.offsetHeight * ZOOM) + 'px';

    lens.style.opacity   = '1';
    result.style.opacity = '1';
    result.style.visibility = 'visible';
    wrap.classList.add('zooming');
  }

  function hide() {
    active = false;
    lens.style.opacity   = '0';
    result.style.opacity = '0';
    result.style.visibility = 'hidden';
    wrap.classList.remove('zooming');
  }

  var isTouch = ('ontouchstart' in window);
  if (!isTouch) {
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mouseleave', hide);
    wrap.addEventListener('mousemove',  moveLens);
  }

  window.addEventListener('resize', throttle(function () {
    result.style.backgroundSize =
      (mainImg.offsetWidth * ZOOM) + 'px ' + (mainImg.offsetHeight * ZOOM) + 'px';
  }, 200));
})();


(function initAppCarousel() {
  var track   = document.getElementById('appTrack');
  var prevBtn = document.getElementById('appPrev');
  var nextBtn = document.getElementById('appNext');
  if (!track) return;

  var slides  = Array.from(track.querySelectorAll('.app-slide'));
  var current = 0;
  var visible = getVisible();

  function getVisible() {
    if (window.innerWidth <= 480)  return 1;
    if (window.innerWidth <= 768)  return 1.5;
    if (window.innerWidth <= 1024) return 2.5;
    return 3.5;
  }

  function getSlideWidth() {
    if (!slides[0]) return 260;
    return slides[0].offsetWidth + 20; /* width + gap */
  }

  function goTo(idx) {
    var max = Math.max(0, slides.length - Math.floor(visible));
    current = Math.max(0, Math.min(idx, max));
    track.style.transform = 'translateX(-' + (current * getSlideWidth()) + 'px)';
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current >= max;
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

  window.addEventListener('resize', throttle(function () {
    visible = getVisible();
    goTo(current);
  }, 200));

  goTo(0);

  /* Touch / swipe */
  var touchStartX = 0;
  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? goTo(current + 1) : goTo(current - 1);
    }
  }, { passive: true });
})();



(function initFAQ() {
  var items = Array.from(document.querySelectorAll('.faq-item'));

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      /* Close ALL items first */
      items.forEach(function (i) {
        i.classList.remove('open');
        var q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      /* Toggle: if was closed → open it */
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

(function initProcessTabs() {
  var tabBtns = Array.from(document.querySelectorAll('.process-tab'));
  var panels  = Array.from(document.querySelectorAll('.process-panel'));
  var prevBtn = document.getElementById('procPrev');
  var nextBtn = document.getElementById('procNext');
  var total   = tabBtns.length;
  var current = 0;

  if (!tabBtns.length) return;

  function goToStep(idx) {
    if (idx < 0 || idx >= total) return;
    current = idx;

    tabBtns.forEach(function(b, i) {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-selected', String(i === idx));
    });
    panels.forEach(function(p) { p.classList.remove('active'); });

    var target = document.querySelector('[data-panel="' + idx + '"]');
    if (target) target.classList.add('active');

    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      goToStep(parseInt(btn.dataset.tab, 10));
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', function() { goToStep(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToStep(current + 1); });

  goToStep(0);
})();


function openModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  /* Trap focus inside modal */
  var focusable = overlay.querySelectorAll('input,button,select,textarea,a[href]');
  if (focusable.length) focusable[0].focus();
}

function closeModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function (m) {
      closeModal(m.id);
    });
  }
});

(function () {
  var form = document.getElementById('catalogueForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('catEmail');
    if (!email || !isValidEmail(email.value.trim())) {
      shakeInput(email);
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ Catalogue sent to your email!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function () {
      closeModal('catalogueModal');
      resetBtn(btn, 'Submit Form');
    }, 2200);
  });
})();

(function () {
  var form = document.getElementById('callbackForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name  = document.getElementById('cbName');
    var email = document.getElementById('cbEmail');
    if (!name || !name.value.trim()) { shakeInput(name); return; }
    if (!email || !isValidEmail(email.value.trim())) { shakeInput(email); return; }
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ We\'ll call you back shortly!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function () {
      closeModal('callbackModal');
      resetBtn(btn, 'Submit Form');
    }, 2200);
  });
})();

(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = '✓ Message sent!';
    btn.style.background = '#16a34a';
    btn.disabled = true;
    setTimeout(function () { resetBtn(btn, 'Request Custom Quote'); }, 3000);
  });
})();


function handleCatalogueEmail(btn) {
  var input = btn.previousElementSibling;
  if (!input) return;
  if (!isValidEmail(input.value.trim())) {
    shakeInput(input);
    return;
  }
  btn.textContent = '✓ Sent!';
  btn.style.background = '#16a34a';
  btn.disabled = true;
  input.value = '';
  input.placeholder = "We'll be in touch shortly!";
  setTimeout(function () { resetBtn(btn, 'Request Catalogue'); }, 3000);
}

(function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var style = document.createElement('style');
  style.textContent = [
    '.fade-up { opacity:0; transform:translateY(28px); transition:opacity .55s ease, transform .55s ease; }',
    '.fade-up.in { opacity:1; transform:translateY(0); }'
  ].join('');
  document.head.appendChild(style);

  var targets = document.querySelectorAll(
    '.feature-card, .portfolio-card, .testi-card, .faq-item, .resource-row, .cert-badge, .step-slide'
  );

  targets.forEach(function (el, i) {
    el.classList.add('fade-up');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { observer.observe(el); });
})();


function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function shakeInput(el) {
  if (!el) return;
  el.style.borderColor = '#ef4444';
  el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.15)';
  el.focus();
  setTimeout(function () {
    el.style.borderColor = '';
    el.style.boxShadow   = '';
  }, 2000);
}

function resetBtn(btn, label) {
  btn.textContent     = label;
  btn.style.background = '';
  btn.disabled        = false;
}
