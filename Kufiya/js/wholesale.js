/**
 * Kufiya Dates - Wholesale JavaScript
 * Handles wholesale inquiry form and interactions
 */

// Wholesale Module
const Wholesale = {
  // Initialize wholesale page
  init() {
    this.setupInquiryForm();
    this.setupSmoothScroll();
    this.setupPricingCalculator();
    this.animateCounters();
    this.setupTestimonialRotation();
  },

  // Setup inquiry form
  setupInquiryForm() {
    const form = document.getElementById("wholesale-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.validateForm(form)) {
        return;
      }

      await this.submitForm(form);
    });

    // Real-time validation
    const inputs = form.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );
    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });

    // Business type change handler
    const businessType = form.querySelector("#businessType");
    if (businessType) {
      businessType.addEventListener("change", (e) => {
        this.handleBusinessTypeChange(e.target.value);
      });
    }

    // VAT number formatting
    const vatInput = form.querySelector("#vatNumber");
    if (vatInput) {
      vatInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      });
    }
  },

  // Setup smooth scroll for CTA buttons
  setupSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (targetId === "#") return;

        e.preventDefault();
        const target = document.querySelector(targetId);

        if (target) {
          const offset = 100; // Account for fixed header
          const targetPosition = target.offsetTop - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  },

  // Setup pricing calculator
  setupPricingCalculator() {
    const volumeSelect = document.getElementById("volume");
    if (!volumeSelect) return;

    // Add calculator button next to volume select
    const calculatorBtn = document.createElement("button");
    calculatorBtn.type = "button";
    calculatorBtn.className = "btn btn-outline btn-small";
    calculatorBtn.textContent = "Calculate Savings";
    calculatorBtn.style.marginTop = "10px";

    volumeSelect.parentElement.appendChild(calculatorBtn);

    calculatorBtn.addEventListener("click", () => {
      this.showPricingCalculator();
    });
  },

  // Show pricing calculator modal
  showPricingCalculator() {
    const modal = document.createElement("div");
    modal.className = "modal show";
    modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                <h2>Wholesale Pricing Calculator</h2>
                <div class="calculator-form">
                    <div class="form-group">
                        <label for="calc-cases">Number of Cases</label>
                        <input type="number" id="calc-cases" min="5" value="10" step="1">
                    </div>
                    <div class="calculator-results">
                        <div class="result-line">
                            <span>Price per Case:</span>
                            <span id="calc-price-per-case">£185</span>
                        </div>
                        <div class="result-line">
                            <span>Total Cost:</span>
                            <span id="calc-total">£1,850</span>
                        </div>
                        <div class="result-line highlight">
                            <span>You Save:</span>
                            <span id="calc-savings">£270</span>
                        </div>
                        <div class="result-line">
                            <span>Per Unit Cost:</span>
                            <span id="calc-unit-cost">£15.42</span>
                        </div>
                    </div>
                    <p class="calculator-note">
                        * Each case contains 12 boxes of 1kg premium Medjool dates<br>
                        * Prices exclude VAT<br>
                        * Free delivery on orders over 10 cases
                    </p>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Setup calculator logic
    const casesInput = modal.querySelector("#calc-cases");
    casesInput.addEventListener("input", () => {
      this.updateCalculatorResults(parseInt(casesInput.value) || 0);
    });

    // Initial calculation
    this.updateCalculatorResults(10);
  },

  // Update calculator results
  updateCalculatorResults(cases) {
    const retailPrice = 24.99 * 12; // £24.99 per kg, 12kg per case
    let pricePerCase, discount;

    if (cases >= 50) {
      pricePerCase = 165;
      discount = 0.22;
    } else if (cases >= 25) {
      pricePerCase = 175;
      discount = 0.17;
    } else if (cases >= 10) {
      pricePerCase = 185;
      discount = 0.13;
    } else if (cases >= 5) {
      pricePerCase = 195;
      discount = 0.08;
    } else {
      pricePerCase = retailPrice;
      discount = 0;
    }

    const total = cases * pricePerCase;
    const savings = cases * (retailPrice - pricePerCase);
    const unitCost = pricePerCase / 12;

    document.getElementById(
      "calc-price-per-case"
    ).textContent = `£${pricePerCase}`;
    document.getElementById(
      "calc-total"
    ).textContent = `£${total.toLocaleString()}`;
    document.getElementById(
      "calc-savings"
    ).textContent = `£${savings.toLocaleString()}`;
    document.getElementById(
      "calc-unit-cost"
    ).textContent = `£${unitCost.toFixed(2)}`;
  },

  // Animate counters
  animateCounters() {
    const counters = document.querySelectorAll("[data-counter]");

    if (!counters.length) return;

    const observerOptions = {
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          !entry.target.classList.contains("counted")
        ) {
          this.animateCounter(entry.target);
        }
      });
    }, observerOptions);

    counters.forEach((counter) => {
      observer.observe(counter);
    });
  },

  // Animate individual counter
  animateCounter(element) {
    const target = parseInt(element.getAttribute("data-counter"));
    const suffix = element.getAttribute("data-suffix") || "";
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    element.classList.add("counted");

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current) + suffix;
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target + suffix;
      }
    };

    updateCounter();
  },

  // Setup testimonial rotation
  setupTestimonialRotation() {
    const testimonials = document.querySelectorAll(".testimonial-card");
    if (testimonials.length <= 3) return;

    let currentIndex = 0;

    setInterval(() => {
      // Hide current set
      testimonials.forEach((testimonial, index) => {
        if (index >= currentIndex && index < currentIndex + 3) {
          testimonial.style.opacity = "0";
        }
      });

      setTimeout(() => {
        // Update index
        currentIndex = (currentIndex + 3) % testimonials.length;

        // Show new set
        testimonials.forEach((testimonial, index) => {
          if (index >= currentIndex && index < currentIndex + 3) {
            testimonial.style.display = "block";
            testimonial.style.opacity = "1";
          } else {
            testimonial.style.display = "none";
          }
        });
      }, 300);
    }, 5000);
  },

  // Validate form
  validateForm(form) {
    let isValid = true;
    const formData = new FormData(form);

    // Business name validation
    const businessName = form.querySelector("#businessName");
    if (businessName.value.trim().length < 2) {
      this.showFieldError(businessName, "Business name is required");
      isValid = false;
    }

    // Business type validation
    const businessType = form.querySelector("#businessType");
    if (!businessType.value) {
      this.showFieldError(businessType, "Please select a business type");
      isValid = false;
    }

    // Contact name validation
    const contactName = form.querySelector("#contactName");
    if (contactName.value.trim().length < 2) {
      this.showFieldError(contactName, "Contact name is required");
      isValid = false;
    }

    // Email validation
    const email = form.querySelector("#email");
    if (!KufiyaDates.validateEmail(email.value)) {
      this.showFieldError(email, "Please enter a valid email address");
      isValid = false;
    }

    // Phone validation
    const phone = form.querySelector("#phone");
    if (!KufiyaDates.validatePhone(phone.value)) {
      this.showFieldError(phone, "Please enter a valid phone number");
      isValid = false;
    }

    // Address validation
    const address = form.querySelector("#address");
    if (address.value.trim().length < 5) {
      this.showFieldError(address, "Please enter a valid address");
      isValid = false;
    }

    // City validation
    const city = form.querySelector("#city");
    if (city.value.trim().length < 2) {
      this.showFieldError(city, "City is required");
      isValid = false;
    }

    // Postcode validation
    const postcode = form.querySelector("#postcode");
    if (!KufiyaDates.validatePostcode(postcode.value)) {
      this.showFieldError(postcode, "Please enter a valid UK postcode");
      isValid = false;
    }

    // Volume validation
    const volume = form.querySelector("#volume");
    if (!volume.value) {
      this.showFieldError(volume, "Please select estimated order volume");
      isValid = false;
    }

    // VAT number validation (if provided)
    const vatNumber = form.querySelector("#vatNumber");
    if (vatNumber.value && !this.validateVATNumber(vatNumber.value)) {
      this.showFieldError(vatNumber, "Please enter a valid VAT number");
      isValid = false;
    }

    return isValid;
  },

  // Validate individual field
  validateField(field) {
    const value = field.value.trim();

    switch (field.id) {
      case "businessName":
      case "contactName":
      case "city":
        if (value.length < 2) {
          this.showFieldError(field, "This field is required");
        }
        break;
      case "email":
        if (!KufiyaDates.validateEmail(value)) {
          this.showFieldError(field, "Please enter a valid email address");
        }
        break;
      case "phone":
        if (!KufiyaDates.validatePhone(value)) {
          this.showFieldError(field, "Please enter a valid phone number");
        }
        break;
      case "postcode":
        if (!KufiyaDates.validatePostcode(value)) {
          this.showFieldError(field, "Please enter a valid UK postcode");
        }
        break;
      case "vatNumber":
        if (value && !this.validateVATNumber(value)) {
          this.showFieldError(field, "Please enter a valid VAT number");
        }
        break;
      case "website":
        if (value && !this.validateURL(value)) {
          this.showFieldError(field, "Please enter a valid URL");
        }
        break;
    }
  },

  // VAT number validation
  validateVATNumber(vatNumber) {
    // Basic UK VAT number validation
    const cleaned = vatNumber.replace(/[^A-Z0-9]/g, "");
    const pattern = /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/;
    return pattern.test(cleaned);
  },

  // URL validation
  validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Show field error
  showFieldError(field, message) {
    field.classList.add("error");
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  },

  // Clear field error
  clearFieldError(field) {
    field.classList.remove("error");
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = "";
    }
  },

  // Handle business type change
  handleBusinessTypeChange(type) {
    // Show/hide relevant fields based on business type
    if (type === "distributor") {
      KufiyaDates.showToast(
        "Distributor applications require additional vetting",
        "info"
      );
    } else if (type === "online") {
      const websiteField = document.getElementById("website").parentElement;
      websiteField.style.display = "block";
    }
  },

  // Submit form
  async submitForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");

    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");

    const formData = new FormData(form);
    const data = {
      business: {
        name: formData.get("businessName"),
        type: formData.get("businessType"),
        vatNumber: formData.get("vatNumber"),
        website: formData.get("website"),
      },
      contact: {
        name: formData.get("contactName"),
        position: formData.get("position"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      },
      address: {
        line1: formData.get("address"),
        city: formData.get("city"),
        postcode: formData.get("postcode"),
      },
      order: {
        volume: formData.get("volume"),
        startDate: formData.get("startDate"),
        requirements: formData.get("requirements"),
      },
      preferences: {
        samples: formData.get("samples") === "on",
        marketing: formData.get("marketing") === "on",
        newsletter: formData.get("newsletter") === "on",
      },
    };

    try {
      const response = await KufiyaDates.apiCall("/wholesale/inquiry", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.success) {
        this.showSuccessMessage(form);

        // Track conversion
        KufiyaDates.trackEvent(
          "Wholesale",
          "inquiry_submitted",
          data.business.type
        );
      } else {
        KufiyaDates.showToast(
          response.message || "Failed to submit inquiry",
          "error"
        );
      }
    } catch (error) {
      console.error("Wholesale form submission error:", error);
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    } finally {
      // Hide loading state
      submitBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");
    }
  },

  // Show success message
  showSuccessMessage(form) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor">
                <path d="M30 0C13.431 0 0 13.431 0 30s13.431 30 30 30 30-13.431 30-30S46.569 0 30 0zm-5 40l-10-10 3.536-3.536L25 32.929l16.464-16.465L45 20 25 40z"/>
            </svg>
            <h3>Thank You for Your Interest!</h3>
            <p>We've received your wholesale inquiry. Our team will review your application and contact you within 24 hours.</p>
            <p>In the meantime, feel free to call us at <a href="tel:+442012345679">+44 20 1234 5679</a> if you have any immediate questions.</p>
        `;

    form.style.display = "none";
    form.parentElement.appendChild(successDiv);

    // Scroll to success message
    successDiv.scrollIntoView({ behavior: "smooth", block: "center" });
  },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Wholesale.init());
} else {
  Wholesale.init();
}
