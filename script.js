// Sidhant Patel portfolio interactions
document.addEventListener('DOMContentLoaded', () => {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const welcomeEnter = document.getElementById('welcomeEnter');

  if (welcomeScreen && welcomeEnter) {
    const showWelcomeScreen = () => {
      document.body.classList.add('welcome-active');
      welcomeScreen.setAttribute('aria-hidden', 'false');
      welcomeScreen.inert = false;
      welcomeEnter.focus({ preventScroll: true });
    };

    if (document.readyState === 'complete') showWelcomeScreen();
    else window.addEventListener('load', showWelcomeScreen, { once: true });

    const enterPortfolio = (scrollAmount = 0) => {
      if (!document.body.classList.contains('welcome-active')) return;
      welcomeScreen.classList.add('is-leaving');
      document.body.classList.remove('welcome-active');
      if (scrollAmount > 0) {
        window.requestAnimationFrame(() => {
          window.scrollBy({
            top: scrollAmount,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
          });
        });
      }
      window.setTimeout(() => {
        welcomeScreen.setAttribute('aria-hidden', 'true');
        welcomeScreen.inert = true;
      }, 850);
    };

    welcomeScreen.addEventListener('wheel', (event) => {
      if (event.deltaY > 0) enterPortfolio(event.deltaY);
    }, { passive: true });

    let touchStartY = null;
    welcomeScreen.addEventListener('touchstart', (event) => {
      touchStartY = event.changedTouches[0]?.clientY ?? null;
    }, { passive: true });
    welcomeScreen.addEventListener('touchend', (event) => {
      const touchEndY = event.changedTouches[0]?.clientY;
      if (touchStartY !== null && touchEndY !== undefined && touchStartY - touchEndY > 40) {
        enterPortfolio(Math.max(160, touchStartY - touchEndY));
      }
      touchStartY = null;
    }, { passive: true });

    welcomeEnter.addEventListener('click', enterPortfolio);
    welcomeScreen.addEventListener('click', (event) => {
      if (event.target === welcomeScreen) enterPortfolio();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') enterPortfolio();
    });
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('navToggle') || document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (navToggle.classList.contains('menu-toggle')) navToggle.textContent = isOpen ? 'Close' : 'Menu';
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navToggle.classList.contains('menu-toggle')) navToggle.textContent = 'Menu';
      });
    });
  }

  const cursorDot = document.getElementById('cursorDot');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (cursorDot && canHover) {
    window.addEventListener('mousemove', (event) => {
      cursorDot.style.left = `${event.clientX}px`;
      cursorDot.style.top = `${event.clientY}px`;
      cursorDot.classList.add('active');
    });
    document.addEventListener('mouseleave', () => cursorDot.classList.remove('active'));
  }

  const revealTargets = document.querySelectorAll(
    '.section-heading, .section-label, .about-grid > div, .skills-list, .project-card, .stat-card, .contact-section > div, .contact-form'
  );
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach((element) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(18px)';
      element.style.transition = 'opacity .6s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1)';
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a, .nav-links a');

  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navAnchors.forEach((anchor) => {
            anchor.style.color = anchor.getAttribute('href') === `#${id}` ? 'var(--text)' : '';
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach((section) => navObserver.observe(section));
  }

  const form = document.getElementById('contactForm') || document.getElementById('contact-form');
  const formNote = document.getElementById('formNote') || document.querySelector('.form-message');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const buttonText = submitButton?.querySelector('.btn__text');
      const originalText = buttonText?.textContent || submitButton?.textContent || 'Send message';

      if (submitButton) {
        submitButton.disabled = true;
        if (buttonText) buttonText.textContent = 'Sending...';
        else submitButton.textContent = 'Sending...';
      }

      window.setTimeout(() => {
        if (buttonText) buttonText.textContent = originalText;
        else if (submitButton) submitButton.textContent = originalText;
        if (submitButton) submitButton.disabled = false;
        if (formNote) formNote.textContent = 'Thanks! This form is a front-end demo - connect it to Formspree, EmailJS, or a backend to receive real messages.';
        form.reset();
      }, 900);
    });
  }

  const birthdayPopup = document.getElementById('birthday-popup');
  const birthdayCloseButton = document.querySelector('.birthday-close-btn');
  const closeBirthdayPopup = () => {
    birthdayPopup?.classList.remove('show');
    document.body.classList.remove('modal-open');
  };

  birthdayCloseButton?.addEventListener('click', closeBirthdayPopup);
  birthdayPopup?.addEventListener('click', (event) => {
    if (event.target === birthdayPopup) closeBirthdayPopup();
  });

  const successPopup = document.getElementById('success-popup');
  const closeSuccessButton = document.querySelector('.popup-close-btn');
  const closeSuccessPopup = () => successPopup?.classList.remove('show');

  closeSuccessButton?.addEventListener('click', closeSuccessPopup);
  successPopup?.addEventListener('click', (event) => {
    if (event.target === successPopup) closeSuccessPopup();
  });
});
