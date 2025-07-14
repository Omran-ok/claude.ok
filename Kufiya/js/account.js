/**
 * Kufiya Dates - Account JavaScript
 * Handles account dashboard functionality
 */

// Account Module
const Account = {
  currentSection: "dashboard",
  userData: null,
  addresses: [],
  orders: [],

  // Initialize account page
  init() {
    // Check if user is logged in
    if (!this.checkAuth()) {
      window.location.href = "login.html?redirect=true&return=account.html";
      return;
    }

    this.loadUserData();
    this.setupEventListeners();
    this.showSection("dashboard");
    this.loadDashboardData();
  },

  // Check authentication
  checkAuth() {
    const user = KufiyaDates.state.user;
    const token = KufiyaDates.getAuthToken();
    return user && token;
  },

  // Load user data
  loadUserData() {
    this.userData = KufiyaDates.state.user;

    // Update UI with user data
    document.getElementById(
      "user-name"
    ).textContent = `Welcome back, ${this.userData.firstName}!`;
    document.getElementById("user-email").textContent = this.userData.email;

    // Populate account details form
    const detailsForm = document.getElementById("details-form");
    if (detailsForm) {
      detailsForm.firstName.value = this.userData.firstName || "";
      detailsForm.lastName.value = this.userData.lastName || "";
      detailsForm.email.value = this.userData.email || "";
      detailsForm.phone.value = this.userData.phone || "";
      detailsForm.dateOfBirth.value = this.userData.dateOfBirth || "";
    }

    // Load user preferences
    this.loadPreferences();
  },

  // Setup event listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".account-nav .nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = item.getAttribute("href").substring(1);
        this.showSection(section);
      });
    });

    // Logout button
    document.getElementById("logout-btn").addEventListener("click", () => {
      this.handleLogout();
    });

    // Forms
    const detailsForm = document.getElementById("details-form");
    if (detailsForm) {
      detailsForm.addEventListener("submit", (e) =>
        this.handleUpdateDetails(e)
      );
    }

    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) =>
        this.handleUpdatePassword(e)
      );
    }

    const addressForm = document.getElementById("address-form");
    if (addressForm) {
      addressForm.addEventListener("submit", (e) => this.handleAddAddress(e));
    }

    // Address modal
    document.getElementById("add-address-btn").addEventListener("click", () => {
      this.showAddressModal();
    });

    document.querySelector(".modal-close").addEventListener("click", () => {
      this.closeAddressModal();
    });

    // Preferences
    document
      .getElementById("save-preferences")
      .addEventListener("click", () => {
        this.savePreferences();
      });

    // Delete account
    document.getElementById("delete-account").addEventListener("click", () => {
      this.handleDeleteAccount();
    });

    // Order filter
    document.getElementById("order-filter").addEventListener("change", (e) => {
      this.filterOrders(e.target.value);
    });
  },

  // Show section
  showSection(sectionName) {
    // Update active nav item
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("href") === `#${sectionName}`) {
        item.classList.add("active");
      }
    });

    // Show active section
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active");
    });

    const activeSection = document.getElementById(sectionName);
    if (activeSection) {
      activeSection.classList.add("active");
    }

    this.currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
      case "orders":
        this.loadOrders();
        break;
      case "addresses":
        this.loadAddresses();
        break;
    }
  },

  // Load dashboard data
  async loadDashboardData() {
    try {
      const response = await KufiyaDates.apiCall("/account/dashboard", {
        method: "GET",
      });

      if (response.success) {
        // Update stats
        document.querySelector(
          ".stat-card:nth-child(1) .stat-value"
        ).textContent = response.data.totalOrders;
        document.querySelector(
          ".stat-card:nth-child(2) .stat-value"
        ).textContent = response.data.loyaltyPoints;
        document.querySelector(
          ".stat-card:nth-child(3) .stat-value"
        ).textContent = KufiyaDates.formatPrice(response.data.totalSpent);
        document.querySelector(
          ".stat-card:nth-child(4) .stat-value"
        ).textContent = response.data.savedAddresses;

        // Update recent orders
        if (
          response.data.recentOrders &&
          response.data.recentOrders.length > 0
        ) {
          this.displayRecentOrders(response.data.recentOrders);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  },

  // Display recent orders
  displayRecentOrders(orders) {
    const container = document.querySelector(".recent-orders");
    if (!orders || orders.length === 0) return;

    let html = '<h3>Recent Orders</h3><div class="orders-list">';

    orders.forEach((order) => {
      html += `
                <div class="order-item">
                    <div class="order-info">
                        <strong>Order #${order.orderNumber}</strong>
                        <p>${KufiyaDates.formatDate(order.date)}</p>
                    </div>
                    <div class="order-details">
                        <p>${order.itemCount} items</p>
                        <p>${KufiyaDates.formatPrice(order.total)}</p>
                    </div>
                    <div class="order-status ${order.status.toLowerCase()}">
                        <span>${order.status}</span>
                    </div>
                </div>
            `;
    });

    html += "</div>";
    container.innerHTML = html;
  },

  // Load orders
  async loadOrders() {
    try {
      const response = await KufiyaDates.apiCall("/account/orders", {
        method: "GET",
      });

      if (response.success && response.orders) {
        this.orders = response.orders;
        this.displayOrders(this.orders);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  },

  // Display orders
  displayOrders(orders) {
    const container = document.querySelector(".orders-list");

    if (!orders || orders.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor">
                        <path d="M30 30c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm0 5c-11.046 0-20 8.954-20 20h40c0-11.046-8.954-20-20-20z"/>
                    </svg>
                    <p>No orders found</p>
                    <a href="shop.html" class="btn btn-primary">Shop Now</a>
                </div>
            `;
      return;
    }

    let html = "";
    orders.forEach((order) => {
      html += `
                <div class="order-item">
                    <div class="order-header">
                        <div>
                            <strong>Order #${order.orderNumber}</strong>
                            <p>${KufiyaDates.formatDate(order.date, "long")}</p>
                        </div>
                        <div class="order-status ${order.status.toLowerCase()}">
                            <span>${order.status}</span>
                        </div>
                    </div>
                    <div class="order-products">
                        ${order.items
                          .map(
                            (item) => `
                            <div class="product-line">
                                <span>${item.name} x ${item.quantity}</span>
                                <span>${KufiyaDates.formatPrice(
                                  item.price * item.quantity
                                )}</span>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <strong>Total: ${KufiyaDates.formatPrice(
                              order.total
                            )}</strong>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-outline btn-small" onclick="Account.viewOrder('${
                              order.orderNumber
                            }')">View Details</button>
                            <button class="btn btn-primary btn-small" onclick="Account.reorder('${
                              order.orderNumber
                            }')">Reorder</button>
                        </div>
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  },

  // Filter orders
  filterOrders(status) {
    if (status === "all") {
      this.displayOrders(this.orders);
    } else {
      const filtered = this.orders.filter(
        (order) => order.status.toLowerCase() === status
      );
      this.displayOrders(filtered);
    }
  },

  // Load addresses
  async loadAddresses() {
    try {
      const response = await KufiyaDates.apiCall("/account/addresses", {
        method: "GET",
      });

      if (response.success && response.addresses) {
        this.addresses = response.addresses;
        this.displayAddresses();
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  },

  // Display addresses
  displayAddresses() {
    const container = document.getElementById("addresses-list");

    if (!this.addresses || this.addresses.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor">
                        <path d="M30 15c-5.523 0-10 4.477-10 10s10 20 10 20 10-14.477 10-20-4.477-10-10-10zm0 13.75a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z"/>
                    </svg>
                    <p>No saved addresses</p>
                    <button class="btn btn-primary" onclick="Account.showAddressModal()">Add Address</button>
                </div>
            `;
      return;
    }

    let html = "";
    this.addresses.forEach((address) => {
      html += `
                <div class="address-card ${address.isDefault ? "default" : ""}">
                    ${
                      address.isDefault
                        ? '<span class="default-badge">Default</span>'
                        : ""
                    }
                    <h4>${address.label}</h4>
                    <p>${address.firstName} ${address.lastName}</p>
                    <p>${address.address1}</p>
                    ${address.address2 ? `<p>${address.address2}</p>` : ""}
                    <p>${address.city}, ${address.postcode}</p>
                    <div class="address-actions">
                        <button class="btn btn-outline btn-small" onclick="Account.editAddress('${
                          address.id
                        }')">Edit</button>
                        ${
                          !address.isDefault
                            ? `<button class="btn btn-outline btn-small" onclick="Account.setDefaultAddress('${address.id}')">Set as Default</button>`
                            : ""
                        }
                        <button class="btn btn-outline btn-small" onclick="Account.deleteAddress('${
                          address.id
                        }')">Delete</button>
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  },

  // Handle update details
  async handleUpdateDetails(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await KufiyaDates.apiCall("/account/update-details", {
        method: "PUT",
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          dateOfBirth: formData.get("dateOfBirth"),
        }),
      });

      if (response.success) {
        KufiyaDates.showToast(
          "Account details updated successfully",
          "success"
        );
        // Update local user data
        Object.assign(this.userData, response.user);
        KufiyaDates.state.user = this.userData;
        KufiyaDates.saveState();
        this.loadUserData();
      } else {
        KufiyaDates.showToast(
          response.message || "Failed to update details",
          "error"
        );
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Handle update password
  async handleUpdatePassword(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      KufiyaDates.showToast("Passwords do not match", "error");
      return;
    }

    try {
      const response = await KufiyaDates.apiCall("/account/update-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword: newPassword,
        }),
      });

      if (response.success) {
        KufiyaDates.showToast("Password updated successfully", "success");
        form.reset();
      } else {
        KufiyaDates.showToast(
          response.message || "Failed to update password",
          "error"
        );
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Show address modal
  showAddressModal(addressId = null) {
    const modal = document.getElementById("address-modal");
    const form = document.getElementById("address-form");

    if (addressId) {
      // Edit mode
      const address = this.addresses.find((a) => a.id === addressId);
      if (address) {
        form.addressLabel.value = address.label;
        form.firstName.value = address.firstName;
        form.lastName.value = address.lastName;
        form.address1.value = address.address1;
        form.address2.value = address.address2 || "";
        form.city.value = address.city;
        form.postcode.value = address.postcode;
        form.defaultAddress.checked = address.isDefault;

        form.dataset.addressId = addressId;
        document.getElementById("address-modal-title").textContent =
          "Edit Address";
      }
    } else {
      // Add mode
      form.reset();
      delete form.dataset.addressId;
      document.getElementById("address-modal-title").textContent =
        "Add New Address";
    }

    modal.classList.add("show");
  },

  // Close address modal
  closeAddressModal() {
    const modal = document.getElementById("address-modal");
    modal.classList.remove("show");

    // Reset form
    const form = document.getElementById("address-form");
    form.reset();
    delete form.dataset.addressId;
  },

  // Handle add/edit address
  async handleAddAddress(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const addressId = form.dataset.addressId;

    const addressData = {
      label: formData.get("addressLabel"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      address1: formData.get("address1"),
      address2: formData.get("address2"),
      city: formData.get("city"),
      postcode: formData.get("postcode"),
      isDefault: formData.get("defaultAddress") === "on",
    };

    try {
      const url = addressId
        ? `/account/addresses/${addressId}`
        : "/account/addresses";
      const method = addressId ? "PUT" : "POST";

      const response = await KufiyaDates.apiCall(url, {
        method: method,
        body: JSON.stringify(addressData),
      });

      if (response.success) {
        KufiyaDates.showToast(
          addressId
            ? "Address updated successfully"
            : "Address added successfully",
          "success"
        );
        this.closeAddressModal();
        this.loadAddresses();
      } else {
        KufiyaDates.showToast(
          response.message || "Failed to save address",
          "error"
        );
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Edit address
  editAddress(addressId) {
    this.showAddressModal(addressId);
  },

  // Set default address
  async setDefaultAddress(addressId) {
    try {
      const response = await KufiyaDates.apiCall(
        `/account/addresses/${addressId}/default`,
        {
          method: "PUT",
        }
      );

      if (response.success) {
        KufiyaDates.showToast("Default address updated", "success");
        this.loadAddresses();
      } else {
        KufiyaDates.showToast("Failed to update default address", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Delete address
  async deleteAddress(addressId) {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await KufiyaDates.apiCall(
        `/account/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );

      if (response.success) {
        KufiyaDates.showToast("Address deleted successfully", "success");
        this.loadAddresses();
      } else {
        KufiyaDates.showToast("Failed to delete address", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Load preferences
  loadPreferences() {
    const preferences = this.userData.preferences || {};

    document.querySelector('input[name="orderUpdates"]').checked =
      preferences.orderUpdates !== false;
    document.querySelector('input[name="promotions"]').checked =
      preferences.promotions !== false;
    document.querySelector('input[name="newsletter"]').checked =
      preferences.newsletter !== false;
    document.querySelector('input[name="sms"]').checked =
      preferences.sms === true;
  },

  // Save preferences
  async savePreferences() {
    const preferences = {
      orderUpdates: document.querySelector('input[name="orderUpdates"]')
        .checked,
      promotions: document.querySelector('input[name="promotions"]').checked,
      newsletter: document.querySelector('input[name="newsletter"]').checked,
      sms: document.querySelector('input[name="sms"]').checked,
    };

    try {
      const response = await KufiyaDates.apiCall("/account/preferences", {
        method: "PUT",
        body: JSON.stringify(preferences),
      });

      if (response.success) {
        KufiyaDates.showToast("Preferences saved successfully", "success");
        this.userData.preferences = preferences;
        KufiyaDates.state.user.preferences = preferences;
        KufiyaDates.saveState();
      } else {
        KufiyaDates.showToast("Failed to save preferences", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // View order details
  viewOrder(orderNumber) {
    // In a real application, this would navigate to an order detail page
    // or show a modal with order details
    window.location.href = `order-detail.html?order=${orderNumber}`;
  },

  // Reorder
  async reorder(orderNumber) {
    try {
      const response = await KufiyaDates.apiCall(
        `/account/orders/${orderNumber}/reorder`,
        {
          method: "POST",
        }
      );

      if (response.success) {
        // Add items to cart
        response.items.forEach((item) => {
          KufiyaDates.addToCart(item);
        });

        KufiyaDates.showToast("Items added to cart", "success");
        setTimeout(() => {
          window.location.href = "cart.html";
        }, 1000);
      } else {
        KufiyaDates.showToast("Failed to reorder", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },

  // Handle logout
  handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      KufiyaDates.logout();
      window.location.href = "index.html";
    }
  },

  // Handle delete account
  async handleDeleteAccount() {
    const confirmed = prompt(
      'Type "DELETE" to confirm account deletion. This action cannot be undone.'
    );

    if (confirmed !== "DELETE") {
      return;
    }

    try {
      const response = await KufiyaDates.apiCall("/account/delete", {
        method: "DELETE",
      });

      if (response.success) {
        KufiyaDates.showToast("Account deleted successfully", "success");
        KufiyaDates.logout();
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        KufiyaDates.showToast("Failed to delete account", "error");
      }
    } catch (error) {
      KufiyaDates.showToast("An error occurred. Please try again.", "error");
    }
  },
};

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("address-modal");
  if (event.target === modal) {
    Account.closeAddressModal();
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Account.init());
} else {
  Account.init();
}
