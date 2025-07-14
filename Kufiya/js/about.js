/**
 * Kufiya Dates - About JavaScript
 * Handles about page interactions and animations
 */

// About Module
const About = {
  // Initialize about page
  init() {
    this.setupScrollAnimations();
    this.setupKufiyaAnimation();
    this.setupTeamCards();
    this.setupValueCards();
    this.initCounters();
    this.setupImageLazyLoading();
  },

  // Setup scroll animations
  setupScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      ".story-content, .value-card, .team-member, .stat-card"
    );

    if (!animatedElements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");

          // Stagger animation for grid items
          if (entry.target.closest(".values-grid, .team-grid")) {
            const siblings = entry.target.parentElement.children;
            Array.from(siblings).forEach((sibling, index) => {
              setTimeout(() => {
                sibling.classList.add("animate-in");
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

  // Setup Kufiya pattern animation
  setupKufiyaAnimation() {
    const kufiyaPattern = document.querySelector(".kufiya-pattern svg");
    if (!kufiyaPattern) return;

    // Create animated pattern effect
    let rotation = 0;
    const animatePattern = () => {
      rotation += 0.5;
      kufiyaPattern.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(animatePattern);
    };

    // Start animation when element is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animatePattern();
          observer.unobserve(entry.target);
        }
      });
    });

    observer.observe(kufiyaPattern);
  },

  // Setup team cards hover effects
  setupTeamCards() {
    const teamMembers = document.querySelectorAll(".team-member");

    teamMembers.forEach((member) => {
      const photo = member.querySelector(".member-photo");
      const bio = member.querySelector(".member-bio");

      member.addEventListener("mouseenter", () => {
        // Add hover effect
        member.classList.add("hovered");

        // Animate photo
        if (photo) {
          photo.style.transform = "scale(1.05)";
        }
      });

      member.addEventListener("mouseleave", () => {
        member.classList.remove("hovered");

        if (photo) {
          photo.style.transform = "scale(1)";
        }
      });

      // Add click functionality for mobile
      member.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          member.classList.toggle("expanded");
        }
      });
    });
  },

  // Setup value cards animation
  setupValueCards() {
    const valueCards = document.querySelectorAll(".value-card");

    valueCards.forEach((card) => {
      const icon = card.querySelector(".value-icon");

      card.addEventListener("mouseenter", () => {
        // Rotate icon
        if (icon) {
          icon.style.transform = "rotateY(360deg)";
        }

        // Add ripple effect
        this.createRipple(card);
      });

      card.addEventListener("mouseleave", () => {
        if (icon) {
          icon.style.transform = "rotateY(0deg)";
        }
      });
    });
  },

  // Create ripple effect
  createRipple(element) {
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = "50%";
    ripple.style.top = "50%";

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 1000);
  },

  // Initialize counters
  initCounters() {
    const statCards = document.querySelectorAll(".stat-card");

    statCards.forEach((card) => {
      const valueElement = card.querySelector(".stat-value");
      if (!valueElement) return;

      const targetValue = valueElement.textContent;
      const isPercentage = targetValue.includes("%");
      const hasPlus = targetValue.includes("+");
      const numericValue = parseInt(targetValue.replace(/[^0-9]/g, ""));

      if (!isNaN(numericValue)) {
        valueElement.setAttribute("data-target", numericValue);
        valueElement.setAttribute(
          "data-suffix",
          isPercentage ? "%" : hasPlus ? "+" : ""
        );
        valueElement.textContent = "0";

        // Observe for animation trigger
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (
                entry.isIntersecting &&
                !entry.target.classList.contains("counted")
              ) {
                this.animateCounter(entry.target);
              }
            });
          },
          { threshold: 0.5 }
        );

        observer.observe(valueElement);
      }
    });
  },

  // Animate counter
  animateCounter(element) {
    const target = parseInt(element.getAttribute("data-target"));
    const suffix = element.getAttribute("data-suffix") || "";
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    element.classList.add("counted");

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString() + suffix;
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString() + suffix;
      }
    };

    updateCounter();
  },

  // Setup image lazy loading
  setupImageLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ("loading" in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      return;
    }

    // Fallback for browsers that don't support lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add("loaded");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  },
};

// Timeline functionality
const Timeline = {
  init() {
    this.createTimeline();
  },

  createTimeline() {
    const storySection = document.querySelector(".story-section");
    if (!storySection) return;

    // Create timeline element
    const timeline = document.createElement("div");
    timeline.className = "story-timeline";
    timeline.innerHTML = `
            <div class="timeline-item" data-year="2020">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Company Founded</h4>
                    <p>Kufiya Dates established in London</p>
                </div>
            </div>
            <div class="timeline-item" data-year="2021">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>First Shipment</h4>
                    <p>Imported first container of premium Medjool dates</p>
                </div>
            </div>
            <div class="timeline-item" data-year="2022">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Expansion</h4>
                    <p>Opened distribution center and expanded UK-wide</p>
                </div>
            </div>
            <div class="timeline-item" data-year="2023">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Recognition</h4>
                    <p>Won Best Imported Food Product award</p>
                </div>
            </div>
            <div class="timeline-item" data-year="2024">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>Present</h4>
                    <p>Serving 5,000+ customers across the UK</p>
                </div>
            </div>
        `;

    // Insert timeline after story content
    const storyContent = storySection.querySelector(".story-content");
    if (storyContent) {
      storyContent.parentElement.insertBefore(
        timeline,
        storyContent.nextSibling
      );
    }

    // Animate timeline items
    const timelineItems = timeline.querySelectorAll(".timeline-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.5 }
    );

    timelineItems.forEach((item) => observer.observe(item));
  },
};

// Interactive map
const InteractiveMap = {
  init() {
    this.createMap();
  },

  createMap() {
    const operationsSection = document.querySelector(".operations-section");
    if (!operationsSection) return;

    // Add interactive UK map showing distribution
    const mapContainer = document.createElement("div");
    mapContainer.className = "uk-distribution-map";
    mapContainer.innerHTML = `
            <h3>Our UK Distribution Network</h3>
            <div class="map-container">
                <svg viewBox="0 0 400 500" class="uk-map">
                    <!-- Simplified UK map -->
                    <path d="M200,50 L250,100 L280,150 L300,250 L280,350 L250,400 L200,450 L150,400 L120,350 L100,250 L120,150 L150,100 Z" 
                          fill="var(--color-bg-secondary)" 
                          stroke="var(--color-border)" 
                          stroke-width="2"/>
                    
                    <!-- Distribution centers -->
                    <circle cx="200" cy="250" r="8" fill="var(--color-primary-red)" class="pulse">
                        <title>London HQ</title>
                    </circle>
                    <circle cx="180" cy="180" r="5" fill="var(--color-primary-gold)">
                        <title>Birmingham</title>
                    </circle>
                    <circle cx="170" cy="150" r="5" fill="var(--color-primary-gold)">
                        <title>Manchester</title>
                    </circle>
                    <circle cx="200" cy="120" r="5" fill="var(--color-primary-gold)">
                        <title>Edinburgh</title>
                    </circle>
                </svg>
                <div class="map-legend">
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--color-primary-red)"></span>
                        <span>Head Office</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--color-primary-gold)"></span>
                        <span>Distribution Partners</span>
                    </div>
                </div>
            </div>
        `;

    const container = operationsSection.querySelector(".container");
    if (container) {
      container.appendChild(mapContainer);
    }
  },
};

// Initialize all modules
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    About.init();
    Timeline.init();
    InteractiveMap.init();
  });
} else {
  About.init();
  Timeline.init();
  InteractiveMap.init();
}
