/**
 * Vishal Mega Mart - Checkout (checkout.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!isAuthenticated()) {
    showToast('Please log in to continue with checkout', 'info');
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  // Check cart
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    window.location.href = 'cart.html';
    return;
  }

  // Pre-fill user information
  const user = getUser();
  if (user) {
    const nameInput = document.getElementById('checkoutFullName');
    if (nameInput) nameInput.value = user.name || '';
  }

  renderCheckoutSummary();

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handlePlaceOrder);
  }
});

function renderCheckoutSummary() {
  const cart = getCart();
  const summaryItemsContainer = document.getElementById('checkoutItemsList');

  let subtotal = 0;

  if (summaryItemsContainer) {
    summaryItemsContainer.innerHTML = cart
      .map((item) => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        return `
        <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-b-0">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-700">${item.quantity}x</span>
            <span class="font-medium text-gray-800 line-clamp-1 max-w-[160px]">${escapeHtml(item.name)}</span>
          </div>
          <span class="font-bold text-gray-900">${formatRupee(lineTotal)}</span>
        </div>
      `;
      })
      .join('');
  }

  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const subtotalEl = document.getElementById('checkoutSubtotal');
  const deliveryEl = document.getElementById('checkoutDelivery');
  const grandTotalEl = document.getElementById('checkoutTotal');

  if (subtotalEl) subtotalEl.innerText = formatRupee(subtotal);
  if (deliveryEl) deliveryEl.innerHTML = deliveryFee === 0 ? '<span class="text-emerald-600 font-bold">FREE</span>' : formatRupee(deliveryFee);
  if (grandTotalEl) grandTotalEl.innerText = formatRupee(grandTotal);
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  const fullName = document.getElementById('checkoutFullName')?.value.trim();
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const street = document.getElementById('checkoutStreet')?.value.trim();
  const city = document.getElementById('checkoutCity')?.value.trim();
  const state = document.getElementById('checkoutState')?.value.trim();
  const pinCode = document.getElementById('checkoutPinCode')?.value.trim();

  if (!fullName || !phone || !street || !city || !pinCode) {
    showToast('Please fill out all required address fields', 'error');
    return;
  }

  const orderPayload = {
    items: cart.map((i) => ({
      product_id: i.product_id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image_url,
    })),
    address: {
      fullName,
      phone,
      street,
      city,
      state: state || 'India',
      pinCode,
    },
    payment_method: 'COD',
  };

  const submitBtn = document.getElementById('btnSubmitOrder');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="spinner"></div>
      <span>Placing Your Order...</span>
    `;
  }

  try {
    const data = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    if (data.success) {
      clearCart();
      showToast('Order placed successfully! Redirecting to orders...', 'success');
      setTimeout(() => {
        window.location.href = 'orders.html?orderPlaced=true';
      }, 1000);
    }
  } catch (error) {
    console.error('Order placement failed:', error);
    const msg = error.message || 'Failed to place order. Please try again.';
    showToast(msg, 'error');

    if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('unauthorized')) {
      setTimeout(() => {
        window.location.href = 'login.html?redirect=checkout.html';
      }, 1500);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Place Order Now</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      `;
    }
  }
}
