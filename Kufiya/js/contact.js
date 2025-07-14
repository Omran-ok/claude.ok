/**
 * Kufiya Dates - Contact JavaScript
 * Handles contact form validation and submission
 */

// Contact Module
const Contact = {
  // Initialize contact page
  init() {
    this.setupContactForm();
    this.setupEventListeners();
    this.loadGoogleMap();
  },

  // Setup contact form
  setupContactForm() {
    const form = document.getElementById("contact-form");
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

    // Subject change handler
    const subjectSelect = form.querySelector("#subject");
    if (subjectSelect) {
      subjectSelect.addEventListener("change", (e) => {
        this.handleSubjectChange(e.target.value);
      });
    }
  },

  // Setup additional event listeners
  setupEventListeners() {
    // Phone number formatting
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", (e) => {
        this.formatPhoneNumber(e.target);
      });
    }

    // Order number formatting
    const orderInput = document.getElementById("orderNumber");
    if (orderInput) {
      orderInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }
  },

  // Validate form
  validateForm(form) {
    let isValid = true;

    // First name validation
    const firstName = form.querySelector("#firstName");
    if (firstName.value.trim().length < 2) {
      this.showFieldError(firstName, "Please enter at least 2 characters");
      isValid = false;
    }

    // Last name validation
    const lastName = form.querySelector("#lastName");
    if (lastName.value.trim().length < 2) {
      this.showFieldError(lastName, "Please enter at least 2 characters");
      isValid = false;
    }

    // Email validation
    const email = form.querySelector("#email");
    if (!this.validateEmail(email.value)) {
      this.showFieldError(email, "Please enter a valid email address");
      isValid = false;
    }

    // Phone validation (if provided)
    const phone = form.querySelector("#phone");
    if (phone.value && !this.validatePhone(phone.value)) {
      this.showFieldError(phone, "Please enter a valid UK phone number");
      isValid = false;
    }

    // Subject validation
    const subject = form.querySelector("#subject");
    if (!subject.value) {
      this.showFieldError(subject, "Please select a subject");
      isValid = false;
    }

    // Message validation
    const message = form.querySelector("#message");
    if (message.value.trim().length < 10) {
      this.showFieldError(message, "Please enter at least 10 characters");
      isValid = false;
    }

    // Order number validation (if order support selected)
    if (subject.value === "order") {
      const orderNumber = form.querySelector("#orderNumber");
      if (orderNumber.value && !this.validateOrderNumber(orderNumber.value)) {
        this.showFieldError(
          orderNumber,
          "Please enter a valid order number (e.g., KD-2024-12345)"
        );
        isValid = false;
      }
    }

    return isValid;
  },

  // Validate individual field
  validateField(field) {
    const value = field.value.trim();

    switch (field.id) {
      case "firstName":
      case "lastName":
        if (value.length < 2) {
          this.showFieldError(field, "Please enter at least 2 characters");
        }
        break;
      case "email":
        if (!this.validateEmail(value)) {
          this.showFieldError(field, "Please enter a valid email address");
        }
        break;
      case "phone":
        if (value && !this.validatePhone(value)) {
          this.showFieldError(field, "Please enter a valid UK phone number");
        }
        break;
      case "subject":
        if (!value) {
          this.showFieldError(field, "Please select a subject");
        }
        break;
      case "message":
        if (value.length < 10) {
          this.showFieldError(field, "Please enter at least 10 characters");
        }
        break;
      case "orderNumber":
        if (value && !this.validateOrderNumber(value)) {
          this.showFieldError(field, "Please enter a valid order number");
        }
        break;
    }
  },

  // Email validation
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Phone validation (UK format)
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, "");
    const re = /^(44|0)[\d]{9,11}$/;
    return re.test(cleaned);
  },

  // Order number validation
  validateOrderNumber(orderNumber) {
    const re = /^KD-\d{4}-\d{5}$/;
    return re.test(orderNumber);
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

  // Format phone number
  formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, "");

    if (value.startsWith("44")) {
      // UK international format
      if (value.length > 2) value = "+44 " + value.substring(2);
      if (value.length > 6)
        value = value.substring(0, 6) + " " + value.substring(6);
      if (value.length > 11)
        value = value.substring(0, 11) + " " + value.substring(11);
    } else if (value.startsWith("0")) {
      // UK national format
      if (value.length > 5)
        value = value.substring(0, 5) + " " + value.substring(5);
      if (value.length > 11) value = value.substring(0, 11);
    }

    input.value = value;
  },

  // Handle subject change
  handleSubjectChange(subject) {
    const orderNumberGroup =
      document.getElementById("orderNumber").parentElement;

    if (subject === "order") {
      orderNumberGroup.style.display = "block";
    } else {
      orderNumberGroup.style.display = "none";
      document.getElementById("orderNumber").value = "";
      this.clearFieldError(document.getElementById("orderNumber"));
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
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      subject: formData.get("subject"),
      orderNumber: formData.get("orderNumber"),
      message: formData.get("message"),
    };

    try {
      const response = await KufiyaDates.apiCall("/contact/submit", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.success) {
        // Show success message
        this.showSuccessMessage(form);

        // Reset form
        form.reset();

        // Track event
        KufiyaDates.trackEvent("Contact", "form_submission", data.subject);
      } else {
        KufiyaDates.showToast(
          response.message || "Failed to send message",
          "error"
        );
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
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
            <h3>Message Sent Successfully!</h3>
            <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
        `;

    form.style.display = "none";
    form.parentElement.appendChild(successDiv);

    // Remove success message after 10 seconds
    setTimeout(() => {
      successDiv.remove();
      form.style.display = "block";
    }, 10000);
  },

  // Load Google Map
  loadGoogleMap() {
    const mapContainer = document.querySelector(".map-container");
    if (!mapContainer) return;

    // In a real implementation, you would load the Google Maps API
    // and initialize the map here
    // For now, we'll keep the placeholder
  },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Contact.init());
} else {
  Contact.init();
}