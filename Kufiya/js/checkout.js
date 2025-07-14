/**
 * Kufiya Dates - Checkout JavaScript
 * Handles checkout process and payment
 */

// Checkout Module
const Checkout = {
  currentStep: 2,
  orderData: {},
  stripe: null,
  elements: null,
  paymentElement: null,

  // Initialize checkout
  async init() {
    // Check if cart is empty
    if (KufiyaDates.state.cart.length === 0) {
      window.location.href = "cart.html";
      return;
    }

    await this.initializeStripe();
    this.setupEventListeners();
    this.loadOrderItems();
    this.loadSavedAddresses();
    this.loadAppliedCoupon();
    this.updateOrderSummary();
  },

  // Initialize Stripe
  async initializeStripe() {
    if (typeof Stripe === "undefined") {
      console.error("Stripe.js not loaded");
      return;
    }

    this.stripe = Stripe(KufiyaDates.config.stripePublicKey);

    // Create payment intent
    try {
      const response = await KufiyaDates.apiCall(
        "/checkout/create-payment-intent",
        {
          method: "POST",
          body: JSON.stringify({
            amount: KufiyaDates.getOrderTotal() * 100, // Convert to pence
            currency: "gbp",
          }),
        }
      );

      if (response.clientSecret) {
        this.setupStripeElements(response.clientSecret);
      }
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      KufiyaDates.showToast("Payment initialization failed", "error");
    }
  },

  // Setup Stripe Elements
  setupStripeElements(clientSecret) {
    const appearance = {
      theme: "stripe",
      variables: {
        colorPrimary: "#d32f2f",
        colorBackground: "#ffffff",
        colorText: "#212121",
        colorDanger: "#f44336",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        borderRadius: "8px",
      },
    };

    this.elements = this.stripe.elements({ appearance, clientSecret });

    // Create payment element
    this.paymentElement = this.elements.create("payment");
    this.paymentElement.mount("#payment-element");

    // Listen for errors
    this.paymentElement.on("change", (event) => {
      const displayError = document.getElementById("payment-message");
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = "";
      }
    });
  },

  // Setup event listeners
  setupEventListeners() {
    const form = document.getElementById("checkout-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmit(e));
    }

    // Billing address toggle
    const sameAsBilling = document.getElementById("sameAsBilling");
    if (sameAsBilling) {
      sameAsBilling.addEventListener("change", (e) => {
        const billingSection = document.getElementById("billing-section");
        billingSection.style.display = e.target.checked ? "none" : "block";
      });
    }

    // Delivery options
    const deliveryOptions = document.querySelectorAll(
      'input[name="deliveryOption"]'
    );
    deliveryOptions.forEach((option) => {
      option.addEventListener("change", () => this.updateDeliveryOption());
    });

    // Payment methods
    const paymentMethods = document.querySelectorAll(
      'input[name="paymentMethod"]'
    );
    paymentMethods.forEach((method) => {
      method.addEventListener("change", (e) =>
        this.switchPaymentMethod(e.target.value)
      );
    });

    // Create account checkbox
    const createAccount = document.getElementById("createAccount");
    if (createAccount) {
      createAccount.addEventListener("change", (e) => {
        if (e.target.checked && !KufiyaDates.state.user) {
          this.showPasswordFields();
        } else {
          this.hidePasswordFields();
        }
      });
    }

    // Real-time validation
    const inputs = form.querySelectorAll("input[required], select[required]");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });

    // Postcode formatting
    const postcodeInputs = document.querySelectorAll(
      "#postcode, #billingPostcode"
    );
    postcodeInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    });
  },

  // Load order items
  loadOrderItems() {
    const container = document.getElementById("order-items");
    const template = document.getElementById("order-item-template");

    if (!container || !template) return;

    container.innerHTML = "";

    KufiyaDates.state.cart.forEach((item) => {
      const clone = template.content.cloneNode(true);

      clone.querySelector(".item-image img").src = item.image;
      clone.querySelector(".item-image img").alt = item.name;
      clone.querySelector(".item-quantity").textContent = item.quantity;
      clone.querySelector("h4").textContent = item.name;
      clone.querySelector(".item-price").textContent = KufiyaDates.formatPrice(
        item.price
      );
      clone.querySelector(".item-total").textContent = KufiyaDates.formatPrice(
        item.price * item.quantity
      );

      container.appendChild(clone);
    });
  },

  // Load saved addresses
  async loadSavedAddresses() {
    if (!KufiyaDates.state.user) return;

    try {
      const response = await KufiyaDates.apiCall("/account/addresses", {
        method: "GET",
      });

      if (response.success && response.addresses.length > 0) {
        this.displaySavedAddresses(response.addresses);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  },

  // Display saved addresses
  displaySavedAddresses(addresses) {
    const container = document.getElementById("saved-addresses");
    if (!container) return;

    let html =
      '<h3>Select a saved address or enter a new one:</h3><div class="saved-addresses-list">';

    addresses.forEach((address) => {
      html += `
                <label class="saved-address-option">
                    <input type="radio" name="savedAddress" value="${
                      address.id
                    }" ${address.isDefault ? "checked" : ""}>
                    <div class="address-content">
                        <strong>${address.label}</strong>
                        <p>${address.firstName} ${address.lastName}</p>
                        <p>${address.address1}</p>
                        ${address.address2 ? `<p>${address.address2}</p>` : ""}
                        <p>${address.city}, ${address.postcode}</p>
                    </div>
                </label>
            `;
    });

    html += "</div>";
    container.innerHTML = html;
    container.style.display = "block";

    // Add event listeners
    container
      .querySelectorAll('input[name="savedAddress"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          if (e.target.checked) {
            const address = addresses.find((a) => a.id === e.target.value);
            if (address) {
              this.fillAddressForm(address);
            }
          }
        });
      });

    // Fill form with default address
    const defaultAddress = addresses.find((a) => a.isDefault);
    if (defaultAddress) {
      this.fillAddressForm(defaultAddress);
    }
  },

  // Fill address form
  fillAddressForm(address) {
    document.getElementById("address1").value = address.address1;
    document.getElementById("address2").value = address.address2 || "";
    document.getElementById("city").value = address.city;
    document.getElementById("county").value = address.county || "";
    document.getElementById("postcode").value = address.postcode;
  },

  // Load applied coupon
  loadAppliedCoupon() {
    const couponData = sessionStorage.getItem("applied_coupon");
    if (couponData) {
      this.appliedCoupon = JSON.parse(couponData);
    }
  },

  // Update order summary
  updateOrderSummary() {
    const subtotal = KufiyaDates.getCartTotal();
    const deliveryOption = document.querySelector(
      'input[name="deliveryOption"]:checked'
    ).value;
    const shippingCost = KufiyaDates.getShippingCost(deliveryOption);
    const discount = this.calculateDiscount(subtotal);
    const vat = KufiyaDates.getCartVAT();
    const total = subtotal + shippingCost - discount + vat;

    // Update display
    document.getElementById("order-subtotal").textContent =
      KufiyaDates.formatPrice(subtotal);
    document.getElementById("order-delivery").textContent =
      KufiyaDates.formatPrice(shippingCost);
    document.getElementById("order-vat").textContent =
      KufiyaDates.formatPrice(vat);
    document.getElementById("order-total").textContent =
      KufiyaDates.formatPrice(total);

    // Update discount display
    if (discount > 0) {
      document.getElementById("discount-line").style.display = "flex";
      document.getElementById(
        "order-discount"
      ).textContent = `-${KufiyaDates.formatPrice(discount)}`;
    } else {
      document.getElementById("discount-line").style.display = "none";
    }

    // Update delivery price display
    if (shippingCost === 0) {
      document.getElementById("standard-price").textContent = "FREE";
    }
  },

  // Calculate discount
  calculateDiscount(subtotal) {
    if (this.appliedCoupon) {
      switch (this.appliedCoupon.type) {
        case "percentage":
          return subtotal * (this.appliedCoupon.value / 100);
        case "fixed":
          return Math.min(this.appliedCoupon.value, subtotal);
        default:
          return 0;
      }
    }
    return 0;
  },

  // Update delivery option
  updateDeliveryOption() {
    this.updateOrderSummary();

    // Update expected delivery date
    const selectedOption = document.querySelector(
      'input[name="deliveryOption"]:checked'
    ).value;
    const deliveryDate = this.calculateDeliveryDate(selectedOption);

    // Show estimated delivery date
    KufiyaDates.showToast(`Estimated delivery: ${deliveryDate}`, "info");
  },

  // Calculate delivery date
  calculateDeliveryDate(option) {
    const today = new Date();
    let deliveryDate = new Date(today);

    switch (option) {
      case "nextday":
        deliveryDate.setDate(today.getDate() + 1);
        break;
      case "express":
        deliveryDate.setDate(today.getDate() + 2);
        break;
      case "standard":
      default:
        deliveryDate.setDate(today.getDate() + 5);
        break;
    }

    // Skip weekends
    if (deliveryDate.getDay() === 0)
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    if (deliveryDate.getDay() === 6)
      deliveryDate.setDate(deliveryDate.getDate() + 2);

    return deliveryDate.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Switch payment method
  switchPaymentMethod(method) {
    // Hide all payment forms
    document.querySelectorAll(".payment-form").forEach((form) => {
      form.style.display = "none";
    });

    // Show selected payment form
    const selectedForm = document.getElementById(`${method}-payment-form`);
    if (selectedForm) {
      selectedForm.style.display = "block";
    }

    // Initialize payment method specific features
    switch (method) {
      case "paypal":
        this.initializePayPal();
        break;
      case "applepay":
        this.initializeApplePay();
        break;
    }
  },

  // Initialize PayPal
  initializePayPal() {
    // In a real implementation, this would load PayPal SDK
    KufiyaDates.showToast("PayPal integration coming soon", "info");
  },

  // Initialize Apple Pay
  initializeApplePay() {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      KufiyaDates.showToast(
        "Apple Pay is not available on this device",
        "error"
      );
      document.querySelector('input[value="card"]').checked = true;
      this.switchPaymentMethod("card");
      return;
    }

    const applePayBtn = document.getElementById("apple-pay-button");
    if (applePayBtn) {
      applePayBtn.addEventListener("click", () => this.handleApplePay());
    }
  },

  // Show password fields for account creation
  showPasswordFields() {
    const container = document.getElementById("customer-section");
    const passwordFields = document.createElement("div");
    passwordFields.id = "password-fields";
    passwordFields.innerHTML = `
            <div class="form-group">
                <label for="password">Create Password</label>
                <input type="password" id="password" name="password" required minlength="8">
                <span class="error-message" id="password-error" role="alert"></span>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
                <span class="error-message" id="confirmPassword-error" role="alert"></span>
            </div>
        `;
    container.appendChild(passwordFields);
  },

  // Hide password fields
  hidePasswordFields() {
    const passwordFields = document.getElementById("password-fields");
    if (passwordFields) {
      passwordFields.remove();
    }
  },

  // Validate field
  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = "";

    switch (field.type) {
      case "email":
        if (!KufiyaDates.validateEmail(value)) {
          errorMessage = "Please enter a valid email address";
          isValid = false;
        }
        break;
      case "tel":
        if (field.required && !KufiyaDates.validatePhone(value)) {
          errorMessage = "Please enter a valid phone number";
          isValid = false;
        }
        break;
      case "text":
        if (field.id === "postcode" || field.id === "billingPostcode") {
          if (!KufiyaDates.validatePostcode(value)) {
            errorMessage = "Please enter a valid UK postcode";
            isValid = false;
          }
        } else if (field.required && value.length < 2) {
          errorMessage = "This field is required";
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  },

  // Show field error
  showFieldError(field, message) {
    field.classList.add("field-error");
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  },

  // Clear field error
  clearFieldError(field) {
    field.classList.remove("field-error");
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = "";
    }
  },

  // Handle form submission
  async handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitButton = document.getElementById("submit-button");
    const buttonText = document.getElementById("button-text");
    const loader = submitButton.querySelector(".btn-loader");

    // Validate form
    if (!this.validateForm(form)) {
      return;
    }

    // Show loading state
    submitButton.disabled = true;
    buttonText.classList.add("hidden");
    loader.classList.remove("hidden");

    try {
      // Collect order data
      this.collectOrderData(form);

      // Process payment based on method
      const paymentMethod = document.querySelector(
        'input[name="paymentMethod"]:checked'
      ).value;

      switch (paymentMethod) {
        case "card":
          await this.processCardPayment();
          break;
        case "paypal":
          await this.processPayPalPayment();
          break;
        case "applepay":
          await this.processApplePayment();
          break;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      KufiyaDates.showToast(
        error.message || "Payment failed. Please try again.",
        "error"
      );

      // Reset button state
      submitButton.disabled = false;
      buttonText.classList.remove("hidden");
      loader.classList.add("hidden");
    }
  },

  // Validate form
  validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll("[required]");

    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Check terms acceptance
    const termsCheckbox = document.getElementById("terms");
    if (!termsCheckbox.checked) {
      this.showFieldError(
        termsCheckbox,
        "You must agree to the terms and conditions"
      );
      isValid = false;
    }

    return isValid;
  },

  // Collect order data
  collectOrderData(form) {
    const formData = new FormData(form);

    this.orderData = {
      customer: {
        email: formData.get("email"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        createAccount: formData.get("createAccount") === "on",
        password: formData.get("password"),
      },
      shipping: {
        address1: formData.get("address1"),
        address2: formData.get("address2"),
        city: formData.get("city"),
        county: formData.get("county"),
        postcode: formData.get("postcode"),
      },
      billing:
        formData.get("sameAsBilling") === "on"
          ? null
          : {
              address1: formData.get("billingAddress1"),
              address2: formData.get("billingAddress2"),
              city: formData.get("billingCity"),
              county: formData.get("billingCounty"),
              postcode: formData.get("billingPostcode"),
            },
      deliveryOption: formData.get("deliveryOption"),
      deliveryNotes: formData.get("deliveryNotes"),
      orderNotes: formData.get("orderNotes"),
      newsletter: formData.get("newsletter") === "on",
      items: KufiyaDates.state.cart,
      coupon: this.appliedCoupon,
      totals: {
        subtotal: KufiyaDates.getCartTotal(),
        shipping: KufiyaDates.getShippingCost(formData.get("deliveryOption")),
        discount: this.calculateDiscount(KufiyaDates.getCartTotal()),
        vat: KufiyaDates.getCartVAT(),
        total: KufiyaDates.getOrderTotal(formData.get("deliveryOption")),
      },
    };
  },

  // Process card payment
  async processCardPayment() {
    if (!this.stripe || !this.elements) {
      throw new Error("Payment system not initialized");
    }

    // Confirm payment
    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation.html`,
        receipt_email: this.orderData.customer.email,
        shipping: {
          name: `${this.orderData.customer.firstName} ${this.orderData.customer.lastName}`,
          phone: this.orderData.customer.phone,
          address: {
            line1: this.orderData.shipping.address1,
            line2: this.orderData.shipping.address2,
            city: this.orderData.shipping.city,
            state: this.orderData.shipping.county,
            postal_code: this.orderData.shipping.postcode,
            country: "GB",
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent.status === "succeeded") {
      await this.completeOrder(paymentIntent.id);
    }
  },

  // Process PayPal payment
  async processPayPalPayment() {
    // In a real implementation, this would use PayPal SDK
    throw new Error("PayPal payment not yet implemented");
  },

  // Process Apple Pay payment
  async processApplePayment() {
    // In a real implementation, this would use Apple Pay API
    throw new Error("Apple Pay not yet implemented");
  },

  // Complete order
  async completeOrder(paymentIntentId) {
    try {
      // Send order to backend
      const response = await KufiyaDates.apiCall("/orders/create", {
        method: "POST",
        body: JSON.stringify({
          ...this.orderData,
          paymentIntentId,
        }),
      });

      if (response.success) {
        // Clear cart
        KufiyaDates.clearCart();

        // Clear coupon
        sessionStorage.removeItem("applied_coupon");

        // Track conversion
        KufiyaDates.trackEvent(
          "Ecommerce",
          "purchase",
          response.orderNumber,
          this.orderData.totals.total
        );

        // Redirect to confirmation
        window.location.href = `order-confirmation.html?order=${response.orderNumber}`;
      } else {
        throw new Error(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Order completion error:", error);
      throw error;
    }
  },

  // Handle Apple Pay
  async handleApplePay() {
    const request = {
      countryCode: "GB",
      currencyCode: "GBP",
      supportedNetworks: ["visa", "masterCard", "amex"],
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Kufiya Dates",
        amount: this.orderData.totals.total.toFixed(2),
      },
    };

    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async (event) => {
      // Validate with backend
      const response = await KufiyaDates.apiCall(
        "/payments/validate-merchant",
        {
          method: "POST",
          body: JSON.stringify({ validationURL: event.validationURL }),
        }
      );

      session.completeMerchantValidation(response.merchantSession);
    };

    session.onpaymentauthorized = async (event) => {
      // Process payment
      try {
        const response = await KufiyaDates.apiCall(
          "/payments/process-apple-pay",
          {
            method: "POST",
            body: JSON.stringify({
              payment: event.payment,
              orderData: this.orderData,
            }),
          }
        );

        if (response.success) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          await this.completeOrder(response.paymentIntentId);
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
      }
    };

    session.begin();
  },
};

// Progress indicator
const CheckoutProgress = {
  init() {
    this.updateProgress();
  },

  updateProgress() {
    const steps = document.querySelectorAll(".progress-step");
    const currentStep = 2; // Details step

    steps.forEach((step, index) => {
      if (index < currentStep - 1) {
        step.classList.add("completed");
        step.classList.remove("active");
      } else if (index === currentStep - 1) {
        step.classList.add("active");
        step.classList.remove("completed");
      } else {
        step.classList.remove("active", "completed");
      }
    });
  },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
    await Checkout.init();
    CheckoutProgress.init();
  });
} else {
  (async () => {
    await Checkout.init();
    CheckoutProgress.init();
  })();
}
