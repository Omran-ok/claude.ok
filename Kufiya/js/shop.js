/**
 * Kufiya Dates - Shop JavaScript
 * Handles product page functionality and interactions
 */

// Shop Module
const Shop = {
  currentProduct: {
    id: "medjool-1kg",
    name: "Kufiya Premium Medjool Dates",
    price: 24.99,
    sku: "KD-MEDJOOL-1KG",
    image: "images/product-main.jpg",
  },

  // Initialize shop page
  init() {
    this.setupProductGallery();
    this.setupQuantityControls();
    this.setupAddToCart();
    this.setupTabs();
    this.setupReviews();
    this.setupZoom();
    this.loadProductData();
  },

  // Setup product gallery
  setupProductGallery() {
    const thumbnails = document.querySelectorAll(".thumbnail");
    const mainImage = document.getElementById("main-image");

    if (!thumbnails.length || !mainImage) return;

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
        const newImage = thumbnail.getAttribute("data-image");

        // Update main image with fade effect
        mainImage.style.opacity = "0";

        setTimeout(() => {
          mainImage.src = newImage;
          mainImage.style.opacity = "1";
        }, 200);

        // Update active thumbnail
        thumbnails.forEach((t) => t.classList.remove("active"));
        thumbnail.classList.add("active");

        // Update zoom image if zoom is active
        if (this.zoomActive) {
          this.updateZoomImage(newImage);
        }
      });
    });

    // Preload images
    thumbnails.forEach((thumbnail) => {
      const img = new Image();
      img.src = thumbnail.getAttribute("data-image");
    });
  },

  // Setup quantity controls
  setupQuantityControls() {
    const decreaseBtn = document.querySelector(".qty-decrease");
    const increaseBtn = document.querySelector(".qty-increase");
    const quantityInput = document.getElementById("quantity");

    if (!decreaseBtn || !increaseBtn || !quantityInput) return;

    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
        this.updateQuantity(currentValue - 1);
      }
    });

    increaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue < 99) {
        quantityInput.value = currentValue + 1;
        this.updateQuantity(currentValue + 1);
      }
    });

    quantityInput.addEventListener("change", (e) => {
      let value = parseInt(e.target.value);

      if (isNaN(value) || value < 1) {
        value = 1;
      } else if (value > 99) {
        value = 99;
      }

      e.target.value = value;
      this.updateQuantity(value);
    });
  },

  // Update quantity
  updateQuantity(quantity) {
    // Update button states
    const decreaseBtn = document.querySelector(".qty-decrease");
    const increaseBtn = document.querySelector(".qty-increase");

    decreaseBtn.disabled = quantity <= 1;
    increaseBtn.disabled = quantity >= 99;

    // Update price display if bulk pricing exists
    this.updatePriceDisplay(quantity);
  },

  // Update price display based on quantity
  updatePriceDisplay(quantity) {
    // In a real application, this would check for bulk pricing
    const basePrice = this.currentProduct.price;
    let totalPrice = basePrice * quantity;

    // Example bulk pricing
    if (quantity >= 10) {
      totalPrice = totalPrice * 0.9; // 10% discount
      this.showBulkDiscount(10);
    } else if (quantity >= 5) {
      totalPrice = totalPrice * 0.95; // 5% discount
      this.showBulkDiscount(5);
    } else {
      this.hideBulkDiscount();
    }
  },

  // Show bulk discount message
  showBulkDiscount(percentage) {
    let discountMessage = document.querySelector(".bulk-discount-message");

    if (!discountMessage) {
      discountMessage = document.createElement("div");
      discountMessage.className = "bulk-discount-message";
      document
        .querySelector(".product-price-section")
        .appendChild(discountMessage);
    }

    discountMessage.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-2h2v2zm0-3H7V4h2v5z"/>
            </svg>
            <span>${percentage}% bulk discount applied!</span>
        `;
    discountMessage.classList.add("show");
  },

  // Hide bulk discount message
  hideBulkDiscount() {
    const discountMessage = document.querySelector(".bulk-discount-message");
    if (discountMessage) {
      discountMessage.classList.remove("show");
    }
  },

  // Setup add to cart functionality
  setupAddToCart() {
    const form = document.getElementById("add-to-cart-form");
    const buyNowBtn = document.getElementById("buy-now");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddToCart();
      });
    }

    if (buyNowBtn) {
      buyNowBtn.addEventListener("click", () => {
        this.handleBuyNow();
      });
    }
  },

  // Handle add to cart
  handleAddToCart() {
    const quantity = parseInt(document.getElementById("quantity").value);

    const product = {
      ...this.currentProduct,
      quantity: quantity,
    };

    KufiyaDates.addToCart(product);

    // Show modal
    this.showCartModal(product);

    // Track event
    KufiyaDates.trackEvent(
      "Ecommerce",
      "add_to_cart",
      product.name,
      product.price * quantity
    );
  },

  // Handle buy now
  handleBuyNow() {
    const quantity = parseInt(document.getElementById("quantity").value);

    const product = {
      ...this.currentProduct,
      quantity: quantity,
    };

    // Add to cart and redirect to checkout
    KufiyaDates.addToCart(product);
    window.location.href = "checkout.html";
  },

  // Show cart modal
  showCartModal(product) {
    const modal = document.getElementById("cart-modal");

    if (modal) {
      modal.classList.add("show");

      // Update modal content with product info
      const modalBody = modal.querySelector(".modal-body p");
      modalBody.textContent = `${product.quantity} x ${product.name} has been added to your cart.`;
    }
  },

  // Setup tabs
  setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("aria-controls");

        // Update button states
        tabButtons.forEach((btn) => {
          btn.classList.remove("active");
          btn.setAttribute("aria-selected", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-selected", "true");

        // Update pane visibility
        tabPanes.forEach((pane) => {
          pane.classList.remove("active");
        });
        document.getElementById(targetId).classList.add("active");

        // Save active tab to URL
        window.history.replaceState({}, "", `#${targetId}`);
      });
    });

    // Check for tab in URL
    const hash = window.location.hash.substring(1);
    if (hash) {
      const targetButton = document.querySelector(`[aria-controls="${hash}"]`);
      if (targetButton) {
        targetButton.click();
      }
    }
  },

  // Setup reviews
  setupReviews() {
    const writeReviewBtn = document.getElementById("write-review");
    const loadMoreBtn = document.querySelector(".load-more");
    const helpfulBtns = document.querySelectorAll(".helpful-btn");

    if (writeReviewBtn) {
      writeReviewBtn.addEventListener("click", () => {
        this.showReviewForm();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        this.loadMoreReviews();
      });
    }

    helpfulBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.markHelpful(e.target);
      });
    });
  },

  // Show review form
  showReviewForm() {
    // In a real application, this would show a modal or expand a form
    if (!KufiyaDates.state.user) {
      // Redirect to login if not authenticated
      window.location.href =
        "login.html?redirect=true&return=shop.html#tab-reviews";
      return;
    }

    KufiyaDates.showToast("Review form coming soon!", "info");
  },

  // Load more reviews
  async loadMoreReviews() {
    const button = document.querySelector(".load-more");
    button.disabled = true;
    button.textContent = "Loading...";

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real application, this would fetch more reviews
      KufiyaDates.showToast("No more reviews to load", "info");
      button.style.display = "none";
    } catch (error) {
      button.disabled = false;
      button.textContent = "Load More Reviews";
      KufiyaDates.showToast("Failed to load reviews", "error");
    }
  },

  // Mark review as helpful
  markHelpful(button) {
    if (button.classList.contains("marked")) {
      return;
    }

    const match = button.textContent.match(/\((\d+)\)/);
    if (match) {
      const count = parseInt(match[1]) + 1;
      button.textContent = button.textContent.replace(/\(\d+\)/, `(${count})`);
      button.classList.add("marked");

      // In a real application, this would send to API
      KufiyaDates.trackEvent("Reviews", "mark_helpful");
    }
  },

  // Setup zoom functionality
  setupZoom() {
    const zoomButton = document.querySelector(".zoom-button");
    const mainImage = document.getElementById("main-image");

    if (!zoomButton || !mainImage) return;

    zoomButton.addEventListener("click", () => {
      this.toggleZoom();
    });

    // Mouse move zoom
    const galleryMain = document.querySelector(".gallery-main");
    let zoomLens = null;
    let zoomResult = null;

    galleryMain.addEventListener("mouseenter", () => {
      if (!this.zoomEnabled) return;
      this.createZoomElements();
    });

    galleryMain.addEventListener("mouseleave", () => {
      this.removeZoomElements();
    });

    galleryMain.addEventListener("mousemove", (e) => {
      if (!this.zoomEnabled || !this.zoomLens) return;
      this.moveZoomLens(e);
    });
  },

  // Toggle zoom
  toggleZoom() {
    this.zoomEnabled = !this.zoomEnabled;
    const zoomButton = document.querySelector(".zoom-button");

    if (this.zoomEnabled) {
      zoomButton.classList.add("active");
      KufiyaDates.showToast("Zoom enabled - hover over image", "info");
    } else {
      zoomButton.classList.remove("active");
      this.removeZoomElements();
    }
  },

  // Create zoom elements
  createZoomElements() {
    if (this.zoomLens) return;

    const galleryMain = document.querySelector(".gallery-main");
    const mainImage = document.getElementById("main-image");

    // Create lens
    this.zoomLens = document.createElement("div");
    this.zoomLens.className = "zoom-lens";
    galleryMain.appendChild(this.zoomLens);

    // Create result container
    this.zoomResult = document.createElement("div");
    this.zoomResult.className = "zoom-result";
    this.zoomResult.style.backgroundImage = `url(${mainImage.src})`;
    galleryMain.appendChild(this.zoomResult);
  },

  // Remove zoom elements
  removeZoomElements() {
    if (this.zoomLens) {
      this.zoomLens.remove();
      this.zoomLens = null;
    }
    if (this.zoomResult) {
      this.zoomResult.remove();
      this.zoomResult = null;
    }
  },

  // Move zoom lens
  moveZoomLens(e) {
    const galleryMain = document.querySelector(".gallery-main");
    const bounds = galleryMain.getBoundingClientRect();

    let x = e.clientX - bounds.left;
    let y = e.clientY - bounds.top;

    // Calculate lens position
    x = x - this.zoomLens.offsetWidth / 2;
    y = y - this.zoomLens.offsetHeight / 2;

    // Prevent lens from going outside image
    if (x > galleryMain.offsetWidth - this.zoomLens.offsetWidth) {
      x = galleryMain.offsetWidth - this.zoomLens.offsetWidth;
    }
    if (x < 0) x = 0;
    if (y > galleryMain.offsetHeight - this.zoomLens.offsetHeight) {
      y = galleryMain.offsetHeight - this.zoomLens.offsetHeight;
    }
    if (y < 0) y = 0;

    // Set lens position
    this.zoomLens.style.left = x + "px";
    this.zoomLens.style.top = y + "px";

    // Update result
    const cx = this.zoomResult.offsetWidth / this.zoomLens.offsetWidth;
    const cy = this.zoomResult.offsetHeight / this.zoomLens.offsetHeight;

    this.zoomResult.style.backgroundSize = `${galleryMain.offsetWidth * cx}px ${
      galleryMain.offsetHeight * cy
    }px`;
    this.zoomResult.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
  },

  // Update zoom image
  updateZoomImage(newImage) {
    if (this.zoomResult) {
      this.zoomResult.style.backgroundImage = `url(${newImage})`;
    }
  },

  // Load product data
  async loadProductData() {
    // In a real application, this would fetch product data from API
    // For now, we'll use the hardcoded data

    // Update structured data
    this.updateStructuredData();

    // Load related products
    this.loadRelatedProducts();
  },

  // Update structured data for SEO
  updateStructuredData() {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (script) {
      const data = JSON.parse(script.textContent);
      data.name = this.currentProduct.name;
      data.sku = this.currentProduct.sku;
      data.offers.price = this.currentProduct.price;
      script.textContent = JSON.stringify(data);
    }
  },

  // Load related products
  loadRelatedProducts() {
    // In a real application, this would fetch related products
    // For now, the HTML already contains them
  },

  // Properties
  zoomEnabled: false,
  zoomLens: null,
  zoomResult: null,
};

// Close modal functionality
function closeModal() {
  const modal = document.getElementById("cart-modal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// Global modal close handler
window.onclick = function (event) {
  const modal = document.getElementById("cart-modal");
  if (
    event.target === modal ||
    event.target.classList.contains("modal-backdrop")
  ) {
    closeModal();
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Shop.init());
} else {
  Shop.init();
}
