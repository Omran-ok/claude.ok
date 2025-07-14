/**
 * Kufiya Dates - Cart JavaScript
 * Handles shopping cart functionality
 */

// Cart Module
const Cart = {
  // Initialize cart page
  init() {
    this.loadCart();
    this.setupEventListeners();
    this.setupCouponForm();
    this.updateCartDisplay();

    // Listen for cart updates from other pages
    window.addEventListener("cartUpdated", (e) => {
      this.loadCart();
      this.updateCartDisplay();
    });
  },

  // Load cart from state
  loadCart() {
    this.items = KufiyaDates.state.cart || [];
  },

  // Setup event listeners
  setupEventListeners() {
    // Clear cart button
    const clearCartBtn = document.getElementById("clear-cart");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => this.handleClearCart());
    }

    // Checkout button
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.handleCheckout());
    }
  },

  // Setup coupon form
  setupCouponForm() {
    const couponForm = document.getElementById("coupon-form");
    if (couponForm) {
      couponForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.applyCoupon(e.target.coupon.value);
      });
    }
  },

  // Update cart display
  updateCartDisplay() {
    const cartContent = document.getElementById("cart-content");
    const emptyCart = document.getElementById("empty-cart");
    const cartGrid = document.getElementById("cart-grid");

    if (this.items.length === 0) {
      emptyCart.style.display = "block";
      cartGrid.style.display = "none";
    } else {
      emptyCart.style.display = "none";
      cartGrid.style.display = "grid";
      this.renderCartItems();
      this.updateSummary();
    }

    // Update cart count in header
    document.getElementById("cart-item-count").textContent = this.items.length;
  },

  // Render cart items
  renderCartItems() {
    const container = document.getElementById("cart-items-list");
    const template = document.getElementById("cart-item-template");

    if (!container || !template) return;

    // Clear existing items
    container.innerHTML = "";

    this.items.forEach((item, index) => {
      const clone = template.content.cloneNode(true);

      // Set product data
      clone.querySelector(".cart-item").dataset.productId = item.id;
      clone.querySelector(".cart-item").dataset.index = index;
      clone.querySelector(".item-image img").src = item.image;
      clone.querySelector(".item-image img").alt = item.name;
      clone.querySelector(".item-name").textContent = item.name;
      clone.querySelector(".price-value").textContent = item.price.toFixed(2);
      clone.querySelector(".qty-input").value = item.quantity;
      clone.querySelector(".total-value").textContent = (
        item.price * item.quantity
      ).toFixed(2);

      // Setup event listeners for this item
      const qtyDecrease = clone.querySelector(".qty-decrease");
      const qtyIncrease = clone.querySelector(".qty-increase");
      const qtyInput = clone.querySelector(".qty-input");
      const removeBtn = clone.querySelector(".remove-btn");

      qtyDecrease.addEventListener("click", () =>
        this.updateQuantity(index, item.quantity - 1)
      );
      qtyIncrease.addEventListener("click", () =>
        this.updateQuantity(index, item.quantity + 1)
      );
      qtyInput.addEventListener("change", (e) =>
        this.updateQuantity(index, parseInt(e.target.value))
      );
      removeBtn.addEventListener("click", () => this.removeItem(index));

      container.appendChild(clone);
    });
  },

  // Update item quantity
  updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
      this.removeItem(index);
      return;
    }

    if (newQuantity > 99) {
      newQuantity = 99;
    }

    this.items[index].quantity = newQuantity;
    KufiyaDates.updateCartItemQuantity(this.items[index].id, newQuantity);

    // Update display
    const cartItem = document.querySelector(
      `.cart-item[data-index="${index}"]`
    );
    if (cartItem) {
      cartItem.querySelector(".qty-input").value = newQuantity;
      cartItem.querySelector(".total-value").textContent = (
        this.items[index].price * newQuantity
      ).toFixed(2);
    }

    this.updateSummary();
  },

  // Remove item from cart
  removeItem(index) {
    const item = this.items[index];
    const cartItem = document.querySelector(
      `.cart-item[data-index="${index}"]`
    );

    // Animate removal
    if (cartItem) {
      cartItem.classList.add("removing");
      setTimeout(() => {
        KufiyaDates.removeFromCart(item.id);
        this.loadCart();
        this.updateCartDisplay();
      }, 300);
    } else {
      KufiyaDates.removeFromCart(item.id);
      this.loadCart();
      this.updateCartDisplay();
    }
  },

  // Update order summary
  updateSummary() {
    const subtotal = KufiyaDates.getCartTotal();
    const shippingCost = this.calculateShipping(subtotal);
    const discount = this.calculateDiscount(subtotal);
    const vat = KufiyaDates.getCartVAT();
    const total = subtotal + shippingCost - discount + vat;

    // Update display
    document.getElementById("subtotal").textContent =
      KufiyaDates.formatPrice(subtotal);
    document.getElementById("delivery-cost").textContent =
      KufiyaDates.formatPrice(shippingCost);
    document.getElementById("vat").textContent = KufiyaDates.formatPrice(vat);
    document.getElementById("total").textContent =
      KufiyaDates.formatPrice(total);

    // Update discount display
    if (discount > 0) {
      document.getElementById("discount-line").style.display = "flex";
      document.getElementById(
        "discount-amount"
      ).textContent = `-${KufiyaDates.formatPrice(discount)}`;
    } else {
      document.getElementById("discount-line").style.display = "none";
    }

    // Update free shipping notice
    this.updateShippingNotice(subtotal);
  },

  // Calculate shipping
  calculateShipping(subtotal) {
    if (subtotal >= KufiyaDates.config.freeShippingThreshold) {
      return 0;
    }
    return KufiyaDates.config.shippingRates.standard;
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

  // Update shipping notice
  updateShippingNotice(subtotal) {
    const notice = document.getElementById("free-shipping-notice");
    const amountSpan = document.getElementById("free-shipping-amount");

    if (subtotal >= KufiyaDates.config.freeShippingThreshold) {
      notice.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                </svg>
                <span>You qualify for free delivery!</span>
            `;
      notice.classList.add("qualified");
    } else {
      const remaining = KufiyaDates.config.freeShippingThreshold - subtotal;
      amountSpan.textContent = remaining.toFixed(2);
      notice.classList.remove("qualified");
    }
  },

  // Apply coupon
  async applyCoupon(code) {
    if (!code) {
      KufiyaDates.showToast("Please enter a coupon code", "error");
      return;
    }

    try {
      // In a real application, this would validate with API
      const validCoupons = {
        WELCOME10: { type: "percentage", value: 10 },
        SAVE5: { type: "fixed", value: 5 },
        BULK20: { type: "percentage", value: 20, minAmount: 50 },
      };

      const coupon = validCoupons[code.toUpperCase()];

      if (coupon) {
        const subtotal = KufiyaDates.getCartTotal();

        if (coupon.minAmount && subtotal < coupon.minAmount) {
          KufiyaDates.showToast(
            `This coupon requires a minimum order of ${KufiyaDates.formatPrice(
              coupon.minAmount
            )}`,
            "error"
          );
          return;
        }

        this.appliedCoupon = { ...coupon, code: code.toUpperCase() };
        document.getElementById(
          "discount-code"
        ).textContent = `(${code.toUpperCase()})`;
        this.updateSummary();

        KufiyaDates.showToast("Coupon applied successfully!", "success");

        // Clear form
        document.getElementById("coupon-form").reset();
      } else {
        KufiyaDates.showToast("Invalid coupon code", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("Failed to apply coupon", "error");
    }
  },

  // Handle clear cart
  handleClearCart() {
    if (confirm("Are you sure you want to clear your cart?")) {
      KufiyaDates.clearCart();
      this.loadCart();
      this.updateCartDisplay();
      KufiyaDates.showToast("Cart cleared", "info");
    }
  },

  // Handle checkout
  handleCheckout() {
    if (this.items.length === 0) {
      KufiyaDates.showToast("Your cart is empty", "error");
      return;
    }

    // Save applied coupon to session
    if (this.appliedCoupon) {
      sessionStorage.setItem(
        "applied_coupon",
        JSON.stringify(this.appliedCoupon)
      );
    }

    // Track event
    const total = KufiyaDates.getOrderTotal();
    KufiyaDates.trackEvent("Ecommerce", "begin_checkout", null, total);

    // Redirect to checkout
    window.location.href = "checkout.html";
  },

  // Properties
  items: [],
  appliedCoupon: null,
};

// Recently viewed products functionality
const RecentlyViewed = {
  init() {
    this.loadRecentProducts();
    this.setupProductLinks();
  },

  loadRecentProducts() {
    // In a real application, this would load from user's browsing history
    // For now, we'll use the static HTML
  },

  setupProductLinks() {
    const productLinks = document.querySelectorAll(
      ".recently-viewed .product-link"
    );

    productLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        // Track product view
        const productName = link.querySelector("h3").textContent;
        KufiyaDates.trackEvent("Ecommerce", "product_view", productName);
      });
    });
  },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    Cart.init();
    RecentlyViewed.init();
  });
} else {
  Cart.init();
  RecentlyViewed.init();
}
