document.addEventListener('DOMContentLoaded', function () {
  const isMobile = window.matchMedia('(max-width: 650px)').matches;
  const titleTargets = document.querySelectorAll('#hero h1, .section-title');
  const introTargets = document.querySelectorAll(
    'nav li, #hero .hero-badge, #hero h1, #hero > .container > p, #hero .counter-box, #hero .btn'
  );
  const revealTargets = document.querySelectorAll(
    '.section-badge, .section-title, .section-sub, .divider, .historia-item, .historia-futuro-card, .motivo-card, .carta-envelope, .capsula-wrapper, .futuro-card, footer'
  );

  const splitTitleLetters = function (element) {
    if (!element || element.dataset.titleSplit === 'true') return;

    const transformNode = function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        Array.from(node.textContent || '').forEach(function (char) {
          if (char === ' ') {
            const space = document.createElement('span');
            space.className = 'flip-space';
            space.textContent = '\u00A0';
            fragment.appendChild(space);
            return;
          }

          const letter = document.createElement('span');
          letter.className = 'flip-char';
          letter.textContent = char;
          fragment.appendChild(letter);
        });
        return fragment;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach(function (child) {
          clone.appendChild(transformNode(child));
        });
        return clone;
      }

      return document.createDocumentFragment();
    };

    const fragment = document.createDocumentFragment();
    Array.from(element.childNodes).forEach(function (child) {
      fragment.appendChild(transformNode(child));
    });

    element.innerHTML = '';
    element.appendChild(fragment);
    element.classList.add('title-flip');

    element.querySelectorAll('.flip-char').forEach(function (charEl, index) {
      charEl.style.setProperty('--flip-delay', index * 32 + 'ms');
    });

    element.dataset.titleSplit = 'true';
  };

  titleTargets.forEach(function (title) {
    splitTitleLetters(title);
  });

  introTargets.forEach(function (el, index) {
    el.classList.add('page-enter');
    el.style.setProperty('--enter-delay', index * 85 + 'ms');
  });

  revealTargets.forEach(function (el, index) {
    el.classList.add('reveal');
    if (el.classList.contains('motivo-card') || el.classList.contains('futuro-card') || el.classList.contains('historia-item')) {
      el.classList.add('reveal-stagger');
      el.style.setProperty('--reveal-delay', (index % 5) * 90 + 'ms');
    }
  });

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('title-flip')) {
          entry.target.classList.add('is-flipped');
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealTargets.forEach(function (el) {
    revealObserver.observe(el);
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const navList = document.querySelector('nav ul');
  let navLockId = null;
  let navLockTimer = null;
  let activeNavId = null;
  let scrollSpyTicking = false;

  let navHighlight = null;
  if (navList) {
    navHighlight = document.createElement('div');
    navHighlight.className = 'nav-highlight';
    navList.prepend(navHighlight);
  }

  const moveNavHighlight = function (link, animate) {
    if (!navHighlight || !link || !navList) return;

    const linkRect = link.getBoundingClientRect();
    const listRect = navList.getBoundingClientRect();

    if (animate) {
      navHighlight.classList.remove('is-moving');
      void navHighlight.offsetWidth;
      navHighlight.classList.add('is-moving');
    }

    navHighlight.style.left = linkRect.left - listRect.left + 'px';
    navHighlight.style.top = linkRect.top - listRect.top + 'px';
    navHighlight.style.width = linkRect.width + 'px';
    navHighlight.style.height = linkRect.height + 'px';
    navHighlight.style.opacity = '1';
  };

  const setActiveLink = function (id, options) {
    if (!id) return;

    const changed = id !== activeNavId;
    const animate = options && Object.prototype.hasOwnProperty.call(options, 'animate')
      ? options.animate
      : changed;
    let activeLink = null;

    navLinks.forEach(function (link) {
      const active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) activeLink = link;
    });

    activeNavId = id;
    moveNavHighlight(activeLink, animate);
  };

  const getScrollSection = function () {
    if (!sections.length) return null;

    const navHeight = document.querySelector('nav')?.offsetHeight || 0;
    const probePosition = window.scrollY + navHeight + window.innerHeight * (isMobile ? 0.2 : 0.28);
    let currentSection = sections[0];

    sections.forEach(function (section) {
      if (probePosition >= section.offsetTop) {
        currentSection = section;
      }
    });

    return currentSection;
  };

  const syncActiveSection = function () {
    const navHeight = document.querySelector('nav')?.offsetHeight || 0;

    if (navLockId) {
      const lockedSection = document.getElementById(navLockId);

      if (lockedSection) {
        const targetTop = Math.max(0, lockedSection.offsetTop - navHeight - 14);
        if (Math.abs(window.scrollY - targetTop) <= 28) {
          navLockId = null;
          window.clearTimeout(navLockTimer);
        }
      }
    }

    if (!navLockId) {
      const currentSection = getScrollSection();
      if (currentSection) {
        setActiveLink(currentSection.id, { animate: currentSection.id !== activeNavId });
      }
    }
  };

  const requestScrollSpy = function () {
    if (scrollSpyTicking) return;

    scrollSpyTicking = true;
    window.requestAnimationFrame(function () {
      syncActiveSection();
      scrollSpyTicking = false;
    });
  };

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      const targetId = link.getAttribute('href');
      const target = targetId ? document.querySelector(targetId) : null;
      if (!target) return;

      event.preventDefault();

      const navHeight = document.querySelector('nav')?.offsetHeight || 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 14;

      navLockId = target.id;
      setActiveLink(target.id, { animate: true });
      window.clearTimeout(navLockTimer);
      navLockTimer = window.setTimeout(function () {
        navLockId = null;
        requestScrollSpy();
      }, 900);

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    });
  });

  const initialSection = Array.from(sections).find(function (section) {
    const rect = section.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.35 && rect.bottom >= window.innerHeight * 0.35;
  }) || sections[0];

  if (initialSection) {
    setActiveLink(initialSection.id, { animate: false });
  }

  window.addEventListener('scroll', requestScrollSpy, { passive: true });
  window.addEventListener('resize', function () {
    syncActiveSection();
  });

  requestScrollSpy();

  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
      const heroTitle = document.querySelector('#hero h1.title-flip');
      if (heroTitle) {
        heroTitle.classList.add('is-flipped');
      }
    });
  });

  const counterNumbers = document.querySelectorAll('.counter-num');
  const counterAnimations = new WeakMap();

  const animateCounterValue = function (element, targetValue, duration) {
    const previousAnimation = counterAnimations.get(element);
    if (previousAnimation) {
      window.cancelAnimationFrame(previousAnimation);
    }

    const startValue = parseInt(element.dataset.displayValue || '0', 10) || 0;
    const endValue = Number.isFinite(targetValue) ? targetValue : startValue;

    if (startValue === endValue) {
      element.dataset.displayValue = String(endValue);
      element.textContent = String(endValue);
      return;
    }

    const animationDuration = duration || 700;
    const startTime = performance.now();
    element.classList.add('is-counting');

    const step = function (now) {
      const progress = Math.min((now - startTime) / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + (endValue - startValue) * eased);

      element.dataset.displayValue = String(nextValue);
      element.textContent = String(nextValue);

      if (progress < 1) {
        const frame = window.requestAnimationFrame(step);
        counterAnimations.set(element, frame);
      } else {
        element.dataset.displayValue = String(endValue);
        element.textContent = String(endValue);
        element.classList.remove('is-counting');
      }
    };

    const frame = window.requestAnimationFrame(step);
    counterAnimations.set(element, frame);
  };

  counterNumbers.forEach(function (element, index) {
    const initialValue = parseInt(element.textContent, 10) || 0;
    element.dataset.displayValue = '0';
    element.textContent = '0';

    window.setTimeout(function () {
      animateCounterValue(element, initialValue, 950 + index * 120);
    }, 360 + index * 110);
  });

  const counterObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const element = mutation.target;
      const observedValue = parseInt(element.textContent, 10);
      const displayValue = parseInt(element.dataset.displayValue || '0', 10);

      if (!Number.isFinite(observedValue) || observedValue === displayValue) {
        return;
      }

      animateCounterValue(element, observedValue, observedValue < displayValue ? 360 : 620);
    });
  });

  counterNumbers.forEach(function (element) {
    counterObserver.observe(element, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });

  const hero = document.getElementById('hero');
  const heroContainer = hero ? hero.querySelector('.container') : null;

  if (hero && heroContainer) {
    const glow = document.createElement('div');
    glow.className = 'mouse-glow';
    hero.appendChild(glow);

    hero.addEventListener('mousemove', function (event) {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      glow.style.left = x + 'px';
      glow.style.top = y + 'px';
      glow.style.opacity = '1';

      const rotateY = ((x / rect.width) - 0.5) * 6;
      const rotateX = ((y / rect.height) - 0.5) * -6;
      heroContainer.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      heroContainer.style.transition = 'transform 0.18s ease-out';
    });

    hero.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
      heroContainer.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }

  const interactiveCards = document.querySelectorAll('.motivo-card, .futuro-card');
  const motionSurfaces = document.querySelectorAll('.motivo-card, .futuro-card, .historia-foto, .historia-futuro-card, .carta-envelope, .capsula-carta');

  motionSurfaces.forEach(function (surface) {
    surface.addEventListener('mousemove', function (event) {
      if (isMobile) return;

      const rect = surface.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const rotateY = (relativeX - 0.5) * 7;
      const rotateX = (0.5 - relativeY) * 6;

      surface.style.setProperty('--surface-rotate-x', rotateX.toFixed(2) + 'deg');
      surface.style.setProperty('--surface-rotate-y', rotateY.toFixed(2) + 'deg');
      surface.style.setProperty('--surface-glow-x', (relativeX * 100).toFixed(2) + '%');
      surface.style.setProperty('--surface-glow-y', (relativeY * 100).toFixed(2) + '%');
    });

    surface.addEventListener('mouseleave', function () {
      surface.style.setProperty('--surface-rotate-x', '0deg');
      surface.style.setProperty('--surface-rotate-y', '0deg');
      surface.style.setProperty('--surface-glow-x', '50%');
      surface.style.setProperty('--surface-glow-y', '20%');
    });
  });

  interactiveCards.forEach(function (card) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');

    const toggleCard = function () {
      const isActive = card.classList.toggle('is-active');
      card.setAttribute('aria-expanded', String(isActive));
    };

    card.addEventListener('click', function () {
      toggleCard();
    });

    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCard();
      }
    });
  });

  const scrollContainers = document.querySelectorAll('section .container');
  let scrollMotionTicking = false;

  const updateScrollMotion = function () {
    scrollContainers.forEach(function (container) {
      const rect = container.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.52;
      const distance = rect.top + rect.height / 2 - viewportCenter;
      const normalized = Math.max(-1, Math.min(1, distance / window.innerHeight));
      const shift = normalized * (isMobile ? -8 : -14);
      const fadeLift = Math.max(0, 1 - Math.abs(normalized));

      container.style.setProperty('--scroll-shift', shift.toFixed(2));
      container.style.setProperty('--scroll-depth', (normalized * (isMobile ? -2.5 : -5)).toFixed(2) + 'deg');
      container.style.setProperty('--scroll-opacity', (0.92 + fadeLift * 0.08).toFixed(3));
    });

    scrollMotionTicking = false;
  };

  const requestScrollMotion = function () {
    if (!scrollMotionTicking) {
      window.requestAnimationFrame(updateScrollMotion);
      scrollMotionTicking = true;
    }
  };

  updateScrollMotion();
  window.addEventListener('scroll', requestScrollMotion, { passive: true });
  window.addEventListener('resize', requestScrollMotion);
});
