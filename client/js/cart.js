/**
 * Vishal Mega Mart - Shopping Cart (cart.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  window.addEventListener('cartUpdated', () => {
    renderCart();
  });
});

function renderCart() {
  const cart = getCart();
  const emptyState = document.getElementById('emptyCartState');
  const cartContent = document.getElementById('cartContent');
  const itemsContainer = document.getElementById('cartItemsList');

  if (cart.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (cartContent) cartContent.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (cartContent) cartContent.classList.remove('hidden');

  let subtotal = 0;

  // Render items
  if (itemsContainer) {
    itemsContainer.innerHTML = cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        return `
        <div class="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition">
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <a href="product.html?id=${item.product_id}" class="flex-shrink-0">
              <img 
                src="${escapeHtml(item.image_url)}" 
                alt="${escapeHtml(item.name)}" 
                class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200"
              />
            </a>
            <div class="flex-1 min-w-0">
              <a href="product.html?id=${item.product_id}" class="text-sm sm:text-base font-bold text-gray-900 hover:text-red-600 transition line-clamp-2">
                ${escapeHtml(item.name)}
              </a>
              <div class="text-xs text-gray-500 mt-1">Price: <span class="font-bold text-gray-800">${formatRupee(item.price)}</span></div>
            </div>
          </div>

          <!-- Quantity Controls & Line Total -->
          <div class="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-2 sm:pt-0">
            <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
              <button 
                onclick="handleCartQtyChange('${item.product_id}', ${item.quantity - 1})"
                class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-sm font-bold transition active:bg-gray-200"
                title="Decrease quantity"
              >
                -
              </button>
              <span class="w-10 text-center text-xs sm:text-sm font-bold text-gray-900">${item.quantity}</span>
              <button 
                onclick="handleCartQtyChange('${item.product_id}', ${item.quantity + 1})"
                class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-sm font-bold transition active:bg-gray-200"
                title="Increase quantity"
              >
                +
              </button>
            </div>

            <div class="text-right">
              <div class="text-sm sm:text-base font-black text-gray-900">${formatRupee(itemTotal)}</div>
              <button 
                onclick="handleRemoveItem('${item.product_id}')"
                class="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline mt-0.5 inline-block"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Calculate delivery fee
  const freeDeliveryThreshold = 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  // Update Summary UI
  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryFeeEl = document.getElementById('cartDeliveryFee');
  const grandTotalEl = document.getElementById('cartGrandTotal');
  const deliveryBannerEl = document.getElementById('deliveryFeeAlert');

  if (subtotalEl) subtotalEl.innerText = formatRupee(subtotal);
  if (deliveryFeeEl) deliveryFeeEl.innerHTML = isFreeDelivery ? '<span class="text-emerald-600 font-bold">FREE</span>' : formatRupee(deliveryFee);
  if (grandTotalEl) grandTotalEl.innerText = formatRupee(grandTotal);

  if (deliveryBannerEl) {
    if (isFreeDelivery) {
      deliveryBannerEl.className = 'bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2 mb-4';
      deliveryBannerEl.innerHTML = `<span>You qualify for <strong>FREE Home Delivery</strong>!</span>`;
    } else {
      const diff = freeDeliveryThreshold - subtotal;
      deliveryBannerEl.className = 'bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-lg flex items-center gap-2 mb-4';
      deliveryBannerEl.innerHTML = `<span>Add <strong>${formatRupee(diff)}</strong> more groceries for <strong>FREE Delivery</strong>!</span>`;
    }
  }
}

function handleCartQtyChange(productId, newQty) {
  updateCartQuantity(productId, newQty);
}

function handleRemoveItem(productId) {
  removeFromCart(productId);
}

function handleClearCart() {
  if (confirm('Are you sure you want to empty your shopping cart?')) {
    clearCart();
    showToast('Your cart has been cleared.', 'info');
  }
}

function proceedToCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  if (!isAuthenticated()) {
    showToast('Please log in to proceed to checkout', 'info');
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  window.location.href = 'checkout.html';
}

window.handleCartQtyChange = handleCartQtyChange;
window.handleRemoveItem = handleRemoveItem;
window.handleClearCart = handleClearCart;
window.proceedToCheckout = proceedToCheckout;
