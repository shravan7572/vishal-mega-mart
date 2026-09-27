/**
 * Vishal Mega Mart - Shared Navbar & Footer Controller
 */

function renderNavbar() {
  const navContainer = document.getElementById('navbar');
  if (!navContainer) return;

  const user = getUser();
  const cartCount = getCartCount();

  const userSection = user
    ? `
    <div class="relative group">
      <button class="flex items-center gap-2 bg-red-700/60 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
        <span>${escapeHtml(user.name.split(' ')[0])}</span>
        ${user.role === 'admin' ? '<span class="bg-amber-400 text-red-900 text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>' : ''}
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 text-gray-800 text-sm hidden group-hover:block z-50 border border-gray-100">
        <div class="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 font-semibold truncate">${escapeHtml(user.email)}</div>
        <a href="orders.html" class="flex items-center gap-2 px-4 py-2 hover:bg-red-50 hover:text-red-600 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          My Orders
        </a>
        ${
          user.role === 'admin'
            ? `<a href="admin.html" class="flex items-center gap-2 px-4 py-2 hover:bg-amber-50 text-amber-700 font-semibold transition">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                 Admin Portal
               </a>`
            : ''
        }
        <button onclick="logout()" class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600 transition border-t border-gray-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Logout
        </button>
      </div>
    </div>
  `
    : `
    <a href="login.html" class="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
      Login / Register
    </a>
  `;

  navContainer.innerHTML = `
    <!-- Top Announcement Strip -->
    <div class="bg-red-700 text-white text-xs py-1.5 px-4 text-center font-medium tracking-wide">
      Special Offer: Flat ₹50 OFF on first order | Free Delivery on grocery orders above ₹499!
    </div>

    <!-- Main Header -->
    <header class="bg-red-600 text-white sticky top-0 z-40 shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-3 md:gap-6">
          
          <!-- Brand Logo -->
          <a href="index.html" class="flex items-center gap-2.5 flex-shrink-0 group">
            <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm group-hover:scale-105 transition transform">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <div>
              <span class="text-xl sm:text-2xl font-black tracking-tight text-white block leading-none">VISHAL</span>
              <span class="text-xs sm:text-sm font-bold tracking-widest text-amber-300 block uppercase">MEGA MART</span>
            </div>
          </a>

          <!-- Search Bar -->
          <form id="globalSearchForm" class="hidden md:flex flex-1 max-w-lg mx-2" onsubmit="handleNavSearch(event)">
            <div class="relative w-full">
              <input
                type="text"
                id="globalSearchInput"
                placeholder="Search fresh groceries, atta, dal, fruits..."
                class="w-full bg-white text-gray-800 placeholder-gray-400 pl-10 pr-20 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <button
                type="submit"
                class="absolute inset-y-1 right-1 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition flex items-center"
              >
                Search
              </button>
            </div>
          </form>

          <!-- Right Action Nav -->
          <div class="flex items-center gap-2 sm:gap-4">
            <a href="products.html" class="hidden sm:flex items-center gap-1.5 text-white/90 hover:text-white px-2 py-1.5 text-sm font-medium hover:bg-red-700/50 rounded-lg transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              <span>Products</span>
            </a>

            ${
              user
                ? `<a href="orders.html" class="hidden sm:flex items-center gap-1.5 text-white/90 hover:text-white px-2 py-1.5 text-sm font-medium hover:bg-red-700/50 rounded-lg transition">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                     <span>Orders</span>
                   </a>`
                : ''
            }

            <!-- Cart Icon with Live Badge -->
            <a href="cart.html" class="relative flex items-center gap-1.5 bg-red-700/70 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="hidden sm:inline">Cart</span>
              <span id="navCartBadge" class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-600 bg-white rounded-full ${cartCount > 0 ? '' : 'hidden'}">
                ${cartCount}
              </span>
            </a>

            <!-- User Auth / Profile -->
            ${userSection}

            <!-- Mobile Hamburger Button -->
            <button onclick="toggleMobileMenu()" class="md:hidden text-white p-2 rounded-lg hover:bg-red-700 focus:outline-none">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>

        <!-- Mobile Search Bar (shows on small screens below top bar) -->
        <div class="md:hidden pb-3">
          <form onsubmit="handleNavSearch(event)" class="relative w-full">
            <input
              type="text"
              id="mobileSearchInput"
              placeholder="Search groceries..."
              class="w-full bg-white text-gray-800 placeholder-gray-400 pl-10 pr-16 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button
              type="submit"
              class="absolute inset-y-1 right-1 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full"
            >
              Search
            </button>
          </form>
        </div>

      </div>

      <!-- Mobile Menu Dropdown -->
      <div id="mobileMenu" class="hidden md:hidden bg-red-700 px-4 pt-2 pb-4 space-y-2 border-t border-red-500">
        <a href="index.html" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-800">Home</a>
        <a href="products.html" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-800">All Products</a>
        <a href="cart.html" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-800">Shopping Cart (${cartCount})</a>
        ${
          user
            ? `
          <a href="orders.html" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-800">My Orders</a>
          ${user.role === 'admin' ? '<a href="admin.html" class="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:bg-red-800">Admin Portal</a>' : ''}
          <button onclick="logout()" class="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-red-800">Logout</button>
        `
            : `
          <a href="login.html" class="block px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:bg-red-800">Login / Register</a>
        `
        }
      </div>
    </header>
  `;
}

function handleNavSearch(e) {
  e.preventDefault();
  const desktopInput = document.getElementById('globalSearchInput');
  const mobileInput = document.getElementById('mobileSearchInput');
  const query = (desktopInput && desktopInput.value) || (mobileInput && mobileInput.value) || '';

  if (query.trim()) {
    window.location.href = `products.html?search=${encodeURIComponent(query.trim())}`;
  } else {
    window.location.href = 'products.html';
  }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function renderFooter() {
  const footerContainer = document.getElementById('footer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="bg-gray-900 text-gray-300 pt-12 pb-8 border-t-4 border-red-600 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <span class="text-2xl font-black text-white">VISHAL</span>
              <span class="text-sm font-bold text-red-500 uppercase tracking-wider">MEGA MART</span>
            </div>
            <p class="text-sm text-gray-400 leading-relaxed mb-4">
              India's favorite destination for fresh groceries, daily essentials, and household products at super-saving prices.
            </p>
            <div class="text-xs text-gray-400">
              <span class="text-emerald-400 font-semibold">● 100% Quality Guarantee</span> | Safe & Contactless Delivery
            </div>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 text-sm uppercase tracking-wider">Grocery Categories</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="products.html?category=Fruits%20%26%20Vegetables" class="hover:text-red-400 transition">Fruits & Vegetables</a></li>
              <li><a href="products.html?category=Dairy%20%26%20Bakery" class="hover:text-red-400 transition">Dairy & Bakery</a></li>
              <li><a href="products.html?category=Staples%20%26%20Grains" class="hover:text-red-400 transition">Staples & Grains</a></li>
              <li><a href="products.html?category=Snacks%20%26%20Beverages" class="hover:text-red-400 transition">Snacks & Beverages</a></li>
              <li><a href="products.html?category=Household%20%26%20Cleaning" class="hover:text-red-400 transition">Household & Cleaning</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 text-sm uppercase tracking-wider">Customer Care</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="orders.html" class="hover:text-red-400 transition">Track Past Orders</a></li>
              <li><a href="cart.html" class="hover:text-red-400 transition">View Shopping Cart</a></li>
              <li><span class="text-gray-400">Toll Free: 1800-123-VMM (8 AM - 10 PM)</span></li>
              <li><span class="text-gray-400">support@vishalmegamart.com</span></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 text-sm uppercase tracking-wider">Payment Options</h4>
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="bg-gray-800 text-gray-300 text-xs px-2.5 py-1.5 rounded font-medium">Cash on Delivery</span>
              <span class="bg-gray-800 text-gray-300 text-xs px-2.5 py-1.5 rounded font-medium">UPI / GPay</span>
              <span class="bg-gray-800 text-gray-300 text-xs px-2.5 py-1.5 rounded font-medium">Credit / Debit Card</span>
            </div>
            <p class="text-xs text-gray-500">
              Safe & 256-bit encrypted checkout. All grocery items are hygienically packaged and sanitized.
            </p>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-4">
          <p>© ${new Date().getFullYear()} Vishal Mega Mart. All rights reserved.</p>
          <div class="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Return Policy</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Update cart badge dynamically when storage changes
window.addEventListener('cartUpdated', () => {
  const badge = document.getElementById('navCartBadge');
  if (badge) {
    const count = getCartCount();
    badge.innerText = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});

window.handleNavSearch = handleNavSearch;
window.toggleMobileMenu = toggleMobileMenu;
window.renderNavbar = renderNavbar;
window.renderFooter = renderFooter;
