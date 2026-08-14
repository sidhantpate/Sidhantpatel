const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.textContent = isOpen ? 'Close' : 'Menu';
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = 'Menu';
    });
  });
}

// Scroll-based animations with Intersection Observer
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.project-card, .stat-card, .form-group, .contact-form, .contact-section > div').forEach((el) => {
  observer.observe(el);
});

document.querySelectorAll('.portrait-frame, .project-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = (0.5 - (y / rect.height)) * 12;

    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
    card.style.setProperty('--lift', '-6px');
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--lift', '0px');
  });
});

// Form interactions and animations
const contactForm = document.querySelector('#contact-form');
const formInputs = document.querySelectorAll('.form-input');
const formMessage = document.querySelector('.form-message');
const popup = document.getElementById('success-popup');
const closeBtn = document.querySelector('.popup-close-btn');

formInputs.forEach((input) => {
  input.addEventListener('focus', function () {
    if (this.parentElement) {
      this.parentElement.style.transform = 'translateX(8px)';
    }
  });

  input.addEventListener('blur', function () {
    if (this.parentElement) {
      this.parentElement.style.transform = 'translateX(0)';
    }
  });

  input.addEventListener('input', () => {
    if (formMessage && formMessage.textContent && !formMessage.textContent.includes('Thanks')) {
      formMessage.textContent = '';
      formMessage.style.opacity = '0';
    }
  });
});

function hideSuccessPopup() {
  if (popup) {
    popup.classList.remove('show');
  }
}

function showSuccessPopup() {
  if (!popup) return;

  popup.classList.add('show');

  const hideTimer = window.setTimeout(() => {
    hideSuccessPopup();
  }, 4000);

  popup.dataset.timer = String(hideTimer);
}

if (closeBtn) {
  closeBtn.addEventListener('click', hideSuccessPopup);
}

if (popup) {
  popup.addEventListener('click', (event) => {
    if (event.target === popup) {
      hideSuccessPopup();
    }
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = contactForm.querySelector('#name')?.value.trim();
    const email = contactForm.querySelector('#email')?.value.trim();
    const message = contactForm.querySelector('#message')?.value.trim();

    if (!name || !email || !message) {
      if (formMessage) {
        formMessage.textContent = 'Please fill in all fields.';
        formMessage.style.color = '#d32f2f';
        formMessage.style.opacity = '1';
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (formMessage) {
        formMessage.textContent = 'Please enter a valid email address.';
        formMessage.style.color = '#d32f2f';
        formMessage.style.opacity = '1';
      }
      return;
    }

    const formData = new FormData(contactForm);

    if (formMessage) {
      formMessage.textContent = 'Sending your message...';
      formMessage.style.color = 'var(--accent)';
      formMessage.style.opacity = '1';
    }

    fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        contactForm.reset();
        showSuccessPopup();

        if (formMessage) {
          formMessage.textContent = '';
          formMessage.style.opacity = '0';
        }
      })
      .catch((error) => {
        console.error('Form error:', error);
        if (formMessage) {
          formMessage.textContent = 'An error occurred. Please try again.';
          formMessage.style.color = '#d32f2f';
          formMessage.style.opacity = '1';
        }
      });
  });
}
