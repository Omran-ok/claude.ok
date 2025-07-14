/**
 * Kufiya Dates - Home JavaScript
 * Handles homepage interactions and animations
 */

// Home Module
const Home = {
  // Initialize homepage
  init() {
    this.setupProductGallery();
    this.setupScrollAnimations();
    this.setupTestimonialSlider();
    this.initializeCounters();
    this.setupHeroParallax();
  },

  // Setup product gallery
  setupProductGallery() {
    const thumbnails = document.querySelectorAll(".product-thumbnails img");
    const mainImage = document.querySelector(".product-main-image img");

    if (!thumbnails.length || !mainImage) return;

    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        // Update main image
        mainImage.src = thumb.getAttribute("data-full") || thumb.src;
        mainImage.alt = thumb.alt;

        // Update active state
        thumbnails.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");

        // Add fade effect
        mainImage.style.opacity = "0";
        setTimeout(() => {
          mainImage.style.opacity = "1";
        }, 100);
      });

      // Preload images
      if (thumb.getAttribute("data-full")) {
        const img = new Image();
        img.src = thumb.getAttribute("data-full");
      }
    });
  },

  // Setup scroll animations
  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll(".scroll-animate");

    if (!animatedElements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          // Add stagger effect for grid items
          if (entry.target.closest(".benefits-grid, .testimonials-grid")) {
            const siblings =
              entry.target.parentElement.querySelectorAll(".scroll-animate");
            siblings.forEach((sibling, index) => {
              setTimeout(() => {
                sibling.classList.add("visible");
              }, index * 100);
            });
          }
        }
      });
    }, observerOptions);

    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  },

  // Setup testimonial slider
  setupTestimonialSlider() {
    const testimonials = document.querySelectorAll(".testimonial-card");

    if (testimonials.length <= 3) return; // No need for slider if 3 or fewer

    let currentIndex = 0;
    const container = document.querySelector(".testimonials-grid");

    // Add navigation buttons
    const navigation = document.createElement("div");
    navigation.className = "testimonial-navigation";
    navigation.innerHTML = `
            <button class="nav-btn prev" aria-label="Previous testimonial">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
            <div class="nav-dots"></div>
            <button class="nav-btn next" aria-label="Next testimonial">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        `;

    container.parentElement.appendChild(navigation);

    // Create dots
    const dotsContainer = navigation.querySelector(".nav-dots");
    const totalSlides = Math.ceil(testimonials.length / 3);

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to testimonial group ${i + 1}`);
      dot.addEventListener("click", () => this.goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    // Navigation event listeners
    navigation
      .querySelector(".prev")
      .addEventListener("click", () => this.previousSlide());
    navigation
      .querySelector(".next")
      .addEventListener("click", () => this.nextSlide());

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    container.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });

    // Auto-play
    setInterval(() => {
      this.nextSlide();
    }, 5000);
  },

  // Slider navigation methods
  goToSlide(index) {
    const container = document.querySelector(".testimonials-grid");
    const dots = document.querySelectorAll(".nav-dots .dot");

    container.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    this.currentSlideIndex = index;
  },

  previousSlide() {
    const totalSlides = document.querySelectorAll(".nav-dots .dot").length;
    const newIndex =
      this.currentSlideIndex > 0 ? this.currentSlideIndex - 1 : totalSlides - 1;
    this.goToSlide(newIndex);
  },

  nextSlide() {
    const totalSlides = document.querySelectorAll(".nav-dots .dot").length;
    const newIndex =
      this.currentSlideIndex < totalSlides - 1 ? this.currentSlideIndex + 1 : 0;
    this.goToSlide(newIndex);
  },

  handleSwipe() {
    if (this.touchEndX < this.touchStartX - 50) {
      this.nextSlide();
    }
    if (this.touchEndX > this.touchStartX + 50) {
      this.previousSlide();
    }
  },

  // Initialize counters
  initializeCounters() {
    const counters = document.querySelectorAll("[data-counter]");

    if (!counters.length) return;

    const animateCounter = (element) => {
      const target = parseInt(element.getAttribute("data-counter"));
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target.toLocaleString();
        }
      };

      updateCounter();
    };

    const observerOptions = {
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          !entry.target.classList.contains("counted")
        ) {
          entry.target.classList.add("counted");
          animateCounter(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach((counter) => {
      observer.observe(counter);
    });
  },

  // Setup hero parallax effect
  setupHeroParallax() {
    const hero = document.querySelector(".hero");
    const heroBackground = document.querySelector(".hero-background");

    if (!hero || !heroBackground) return;

    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      heroBackground.style.transform = `translateY(${rate}px)`;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestTick);
  },

  // Current slide index
  currentSlideIndex: 0,
  touchStartX: 0,
  touchEndX: 0,
};

// Product showcase functionality
const ProductShowcase = {
  init() {
    const addToCartBtn = document.querySelector(
      ".product-showcase .btn-primary"
    );
    const learnMoreBtn = document.querySelector(
      ".product-showcase .btn-outline"
    );

    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.quickAddToCart();
      });
    }

    if (learnMoreBtn) {
      learnMoreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "shop.html";
      });
    }
  },

  quickAddToCart() {
    const product = {
      id: "medjool-1kg",
      name: "Kufiya Premium Medjool Dates",
      price: 24.99,
      image: "images/product-main.jpg",
      quantity: 1,
    };

    KufiyaDates.addToCart(product);

    // Show success animation
    const button = document.querySelector(".product-showcase .btn-primary");
    const originalText = button.innerHTML;

    button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
            <span>Added to Cart!</span>
        `;

    button.classList.add("success");

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove("success");
    }, 2000);
  },
};

// Hero CTA animations
const HeroCTA = {
  init() {
    const ctaButtons = document.querySelectorAll(".hero-cta .btn");

    ctaButtons.forEach((button) => {
      button.addEventListener("mouseenter", (e) => {
        this.createRipple(e);
      });
    });
  },

  createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    ripple.className = "ripple";

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  },
};

// Newsletter form enhancement
const NewsletterEnhancement = {
  init() {
    const forms = document.querySelectorAll(".newsletter-form");

    forms.forEach((form) => {
      const input = form.querySelector('input[type="email"]');

      if (input) {
        input.addEventListener("focus", () => {
          form.classList.add("focused");
        });

        input.addEventListener("blur", () => {
          if (!input.value) {
            form.classList.remove("focused");
          }
        });
      }
    });
  },
};

// Initialize all modules when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    Home.init();
    ProductShowcase.init();
    HeroCTA.init();
    NewsletterEnhancement.init();
  });
} else {
  Home.init();
  ProductShowcase.init();
  HeroCTA.init();
  NewsletterEnhancement.init();
}
