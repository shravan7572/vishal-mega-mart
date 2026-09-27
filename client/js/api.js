/**
 * Vishal Mega Mart - Client API & State Management
 */

const API_BASE = (function () {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:5050/api';
    }
    if (window.location.port && window.location.port !== '5050' && window.location.port !== '5051') {
      return 'http://localhost:5050/api';
    }
  }
  return '/api';
})();

// Storage keys
const TOKEN_KEY = 'vmm_token';
const USER_KEY = 'vmm_user';
const CART_KEY = 'vmm_cart';

// --- ESCAPE HTML UTILITY ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- AUTH & USER HELPERS ---
function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined' || token === '""') {
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
}

function setAuth(token, user) {
  if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user && typeof user === 'object') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event('authChanged'));
}

function getUser() {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr || userStr === 'null' || userStr === 'undefined') {
      return null;
    }
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function isAuthenticated() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('authChanged'));
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 600);
}

// --- FETCH WRAPPER ---
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// --- CART STATE IN LOCALSTORAGE ---
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.product_id === (product._id || product.product_id));

  const maxStock = product.stock !== undefined ? product.stock : 999;

  if (existing) {
    if (existing.quantity + quantity > maxStock) {
      showToast(`Cannot add more than ${maxStock} in stock`, 'error');
      return false;
    }
    existing.quantity += quantity;
  } else {
    if (quantity > maxStock) {
      showToast(`Only ${maxStock} items available in stock`, 'error');
      return false;
    }
    cart.push({
      product_id: product._id || product.product_id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      quantity,
    });
  }

  saveCart(cart);
  showToast(`Added "${product.name}" to cart!`, 'success');
  return true;
}

function updateCartQuantity(productId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.product_id !== productId);
  } else {
    const item = cart.find((i) => i.product_id === productId);
    if (item) {
      if (item.stock !== undefined && quantity > item.stock) {
        showToast(`Only ${item.stock} available in stock`, 'error');
        return;
      }
      item.quantity = quantity;
    }
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.product_id !== productId);
  saveCart(cart);
  showToast('Item removed from cart', 'info');
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cartUpdated'));
}

function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
}

// --- UTILITY HELPERS ---
function formatRupee(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg =
    type === 'success'
      ? `<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`
      : type === 'error'
      ? `<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`
      : `<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1">${message}</div>
    <button class="ml-2 text-white/80 hover:text-white text-lg font-bold" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.escapeHtml = escapeHtml;
window.getToken = getToken;
window.setAuth = setAuth;
window.getUser = getUser;
window.isAuthenticated = isAuthenticated;
window.isAdmin = isAdmin;
window.logout = logout;
window.apiFetch = apiFetch;
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCartCount = getCartCount;
window.getCartSubtotal = getCartSubtotal;
window.formatRupee = formatRupee;
window.showToast = showToast;
