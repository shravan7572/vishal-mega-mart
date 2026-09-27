/**
 * Vishal Mega Mart - Admin Dashboard (admin.js)
 */

let allAdminProducts = [];
let allAdminCategories = [];
let allAdminOrders = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // STRICT AUTH GUARD
  if (!isAuthenticated()) {
    showToast('Admin login required', 'error');
    window.location.href = 'login.html?redirect=admin.html';
    return;
  }

  if (!isAdmin()) {
    showToast('Access denied: You need an administrator account to view this page.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
    return;
  }

  // Load dashboard data
  await loadCategories();
  await loadProducts();
  await loadOrders();

  // Attach Add Product form listener
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', handleAddProduct);
  }

  // Attach Edit Product form listener
  const editProductForm = document.getElementById('editProductForm');
  if (editProductForm) {
    editProductForm.addEventListener('submit', handleUpdateProduct);
  }

  // Attach New Category form listener
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', handleAddCategory);
  }
});

// --- LOAD CATEGORIES ---
async function loadCategories() {
  try {
    const data = await apiFetch('/categories');
    allAdminCategories = data.categories || [];

    const categorySelect = document.getElementById('productCategorySelect');
    const editCategorySelect = document.getElementById('editProductCategorySelect');

    const optionsHtml =
      `<option value="" disabled selected>Select category...</option>` +
      allAdminCategories.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');

    if (categorySelect) categorySelect.innerHTML = optionsHtml;
    if (editCategorySelect) editCategorySelect.innerHTML = optionsHtml;
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

// --- LOAD PRODUCTS ---
async function loadProducts() {
  const tableBody = document.getElementById('adminProductsTableBody');
  if (!tableBody) return;

  try {
    const data = await apiFetch('/products');
    allAdminProducts = data.products || [];

    updateMetrics();

    if (allAdminProducts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-gray-400">No products found in the catalog.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = allAdminProducts
      .map((p) => {
        const catName = p.category_id && typeof p.category_id === 'object' ? p.category_id.name : 'Unknown';
        const isOutOfStock = p.stock <= 0;
        const isLowStock = p.stock > 0 && p.stock <= 10;

        const stockBadge = isOutOfStock
          ? `<span class="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">Out of Stock (0)</span>`
          : isLowStock
          ? `<span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">Low Stock (${p.stock})</span>`
          : `<span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">${p.stock} in stock</span>`;

        return `
        <tr class="hover:bg-gray-50/80 transition border-b border-gray-100">
          <td class="px-5 py-3.5 whitespace-nowrap">
            <div class="flex items-center gap-3">
              <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" class="w-12 h-12 object-cover rounded-lg border border-gray-200" />
              <div>
                <a href="product.html?id=${p._id}" target="_blank" class="font-bold text-sm text-gray-900 hover:text-red-600 transition block line-clamp-1 max-w-xs">
                  ${escapeHtml(p.name)}
                </a>
                <span class="text-xs text-gray-500">${escapeHtml(catName)}</span>
              </div>
            </div>
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900 text-sm">
            ${formatRupee(p.price)}
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap">
            ${stockBadge}
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
            <button 
              onclick="openEditModal('${p._id}')" 
              class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold transition"
            >
              Edit
            </button>
            <button 
              onclick="handleDeleteProduct('${p._id}')" 
              class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-semibold transition"
            >
              Delete
            </button>
          </td>
        </tr>
      `;
      })
      .join('');
  } catch (err) {
    console.error('Failed to load admin products:', err);
    showToast('Failed to load products list', 'error');
  }
}

// --- LOAD ORDERS & PIPELINE MANAGEMENT ---
let currentStatusFilter = 'All';
let orderSearchTerm = '';
let activeModalOrderId = null;

async function loadOrders() {
  try {
    const data = await apiFetch('/orders');
    allAdminOrders = data.orders || [];

    updateMetrics();
    updateOrderTabCounts();
    renderOrdersTable();

    // If modal is currently open, refresh it with updated order data
    if (activeModalOrderId) {
      const refreshedOrder = allAdminOrders.find((o) => o._id === activeModalOrderId);
      if (refreshedOrder) {
        populateOrderModal(refreshedOrder);
      }
    }
  } catch (err) {
    console.error('Failed to load admin orders:', err);
    showToast('Failed to load store orders', 'error');
  }
}

function updateOrderTabCounts() {
  const counts = {
    All: allAdminOrders.length,
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  allAdminOrders.forEach((o) => {
    if (counts[o.status] !== undefined) {
      counts[o.status]++;
    }
  });

  const badgeEl = document.getElementById('adminOrdersLiveBadge');
  if (badgeEl) badgeEl.innerText = `${counts.All} Total`;

  const tabKeys = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  tabKeys.forEach((key) => {
    const el = document.getElementById(`tabCount${key}`);
    if (el) el.innerText = counts[key] || 0;
  });
}

function filterAdminOrdersByStatus(status) {
  currentStatusFilter = status;

  const tabKeys = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  tabKeys.forEach((key) => {
    const tabBtn = document.getElementById(`orderTab${key}`);
    if (tabBtn) {
      if (key === status) {
        tabBtn.className = 'order-tab px-3.5 py-2 rounded-lg transition bg-white text-red-600 shadow-sm font-bold';
      } else {
        tabBtn.className = 'order-tab px-3.5 py-2 rounded-lg transition text-gray-600 hover:text-gray-900 hover:bg-white/60 font-semibold';
      }
    }
  });

  renderOrdersTable();
}

function handleAdminOrderSearch(term) {
  orderSearchTerm = (term || '').trim().toLowerCase();
  renderOrdersTable();
}

function renderOrdersTable() {
  const tableBody = document.getElementById('adminOrdersTableBody');
  if (!tableBody) return;

  let filtered = allAdminOrders;

  // Filter by status tab
  if (currentStatusFilter !== 'All') {
    filtered = filtered.filter((o) => o.status === currentStatusFilter);
  }

  // Filter by search term
  if (orderSearchTerm) {
    filtered = filtered.filter((o) => {
      const shortId = o._id.substring(o._id.length - 8).toLowerCase();
      const fullId = o._id.toLowerCase();
      const customerName = (o.customer_id?.name || o.address?.fullName || '').toLowerCase();
      const phone = (o.address?.phone || '').toLowerCase();
      const city = (o.address?.city || '').toLowerCase();
      return shortId.includes(orderSearchTerm) ||
             fullId.includes(orderSearchTerm) ||
             customerName.includes(orderSearchTerm) ||
             phone.includes(orderSearchTerm) ||
             city.includes(orderSearchTerm);
    });
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-gray-400">
          <div class="max-w-xs mx-auto space-y-1">
            <p class="font-semibold text-gray-700 text-sm">No orders matching "${currentStatusFilter}"</p>
            <p class="text-xs text-gray-400">${orderSearchTerm ? 'Try adjusting your search keywords.' : 'Orders placed by customers will appear here.'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .map((order) => {
      const shortId = order._id.substring(order._id.length - 8).toUpperCase();
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const customerName = order.customer_id?.name || order.address?.fullName || 'Customer';
      const itemCount = order.items ? order.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0;
      const itemsPreview = order.items && order.items.length > 0 
        ? order.items.map((it) => `${it.product_id?.name || 'Product'} (x${it.quantity})`).slice(0, 2).join(', ') + (order.items.length > 2 ? ` +${order.items.length - 2} more` : '')
        : 'No items';

      // Status pill styling
      let statusBadge = '';
      if (order.status === 'Pending') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pending</span>`;
      } else if (order.status === 'Processing') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Processing</span>`;
      } else if (order.status === 'Shipped') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Shipped</span>`;
      } else if (order.status === 'Delivered') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Delivered</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Cancelled</span>`;
      }

      // Action workflow buttons based on state
      let workflowControls = '';
      if (order.status === 'Pending') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Processing')" 
            class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition border border-blue-200"
            title="Mark as being packed"
          >
            Pack Order
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
            title="Cancel and auto-restore stock"
          >
            Cancel
          </button>
        `;
      } else if (order.status === 'Processing') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Shipped')" 
            class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition border border-indigo-200"
            title="Dispatch with delivery partner"
          >
            Dispatch
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
            title="Cancel and auto-restore stock"
          >
            Cancel
          </button>
        `;
      } else if (order.status === 'Shipped') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Delivered')" 
            class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition border border-emerald-200"
            title="Collect cash & complete delivery"
          >
            Deliver & Collect COD
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
            title="Cancel and auto-restore stock"
          >
            Cancel
          </button>
        `;
      } else if (order.status === 'Delivered') {
        workflowControls = `
          <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
            Fulfilled & Paid
          </span>
        `;
      } else {
        workflowControls = `
          <span class="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
            Stock Restored
          </span>
        `;
      }

      return `
        <tr class="hover:bg-gray-50/80 transition border-b border-gray-100">
          <td class="px-5 py-3.5 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">#${shortId}</span>
              <button 
                onclick="openOrderModal('${order._id}')" 
                class="text-xs font-bold text-gray-600 hover:text-red-600 transition underline decoration-gray-300 underline-offset-2"
              >
                Inspect
              </button>
            </div>
            <div class="text-[11px] text-gray-400 mt-1">${dateStr}</div>
          </td>
          <td class="px-5 py-3.5">
            <div class="font-bold text-xs text-gray-900">${escapeHtml(customerName)}</div>
            <div class="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
              ${escapeHtml(order.address?.city || '')} &bull; Ph: ${escapeHtml(order.address?.phone || '')}
            </div>
          </td>
          <td class="px-5 py-3.5 max-w-xs">
            <div class="text-xs font-bold text-gray-900">${itemCount} items</div>
            <div class="text-[11px] text-gray-500 truncate mt-0.5">${escapeHtml(itemsPreview)}</div>
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap">
            <div class="font-black text-sm text-gray-900">${formatRupee(order.total)}</div>
            <span class="inline-block text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-0.5">
              ${order.payment_method}
            </span>
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap">
            ${statusBadge}
          </td>
          <td class="px-5 py-3.5 whitespace-nowrap text-right space-x-1.5">
            ${workflowControls}
          </td>
        </tr>
      `;
    })
    .join('');
}

// --- ORDER DETAILS MODAL ---
function openOrderModal(orderId) {
  const order = allAdminOrders.find((o) => o._id === orderId);
  if (!order) {
    showToast('Order not found', 'error');
    return;
  }

  activeModalOrderId = orderId;
  populateOrderModal(order);

  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.classList.remove('hidden');
}

function closeOrderModal() {
  activeModalOrderId = null;
  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.classList.add('hidden');
}

function populateOrderModal(order) {
  const shortId = order._id.substring(order._id.length - 8).toUpperCase();
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header
  const refEl = document.getElementById('modalOrderRef');
  if (refEl) refEl.innerText = `#${shortId}`;

  const dateEl = document.getElementById('modalOrderDate');
  if (dateEl) dateEl.innerText = `Placed on ${dateStr}`;

  const badgeEl = document.getElementById('modalOrderStatusBadge');
  if (badgeEl) {
    badgeEl.innerText = order.status;
    badgeEl.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full ' +
      (order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
       order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
       order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
       order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
       'bg-gray-200 text-gray-700');
  }

  // Timeline
  const timelineEl = document.getElementById('modalOrderTimeline');
  if (timelineEl) {
    if (order.status === 'Cancelled') {
      timelineEl.innerHTML = `
        <div class="col-span-4 bg-red-50 text-red-700 border border-red-200 p-2.5 rounded-lg text-center font-bold text-xs">
          Order Cancelled &bull; All product quantities have been returned to warehouse inventory stock.
        </div>
      `;
    } else {
      const steps = [
        { key: 'Pending', label: '1. Received' },
        { key: 'Processing', label: '2. Packing' },
        { key: 'Shipped', label: '3. Dispatched' },
        { key: 'Delivered', label: '4. Delivered' },
      ];

      const stepWeights = { Pending: 1, Processing: 2, Shipped: 3, Delivered: 4 };
      const currentWeight = stepWeights[order.status] || 1;

      timelineEl.innerHTML = steps
        .map((step, idx) => {
          const stepWeight = stepWeights[step.key];
          const isPassed = stepWeight <= currentWeight;
          const isCurrent = stepWeight === currentWeight;

          const bgClass = isCurrent
            ? 'bg-red-600 text-white shadow-sm'
            : isPassed
            ? 'bg-red-100 text-red-700 font-bold'
            : 'bg-white text-gray-400 border border-gray-200';

          return `
            <div class="p-2 rounded-lg ${bgClass} transition text-center">
              <div class="text-[11px] leading-tight font-bold">${step.label}</div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Customer info
  const custNameEl = document.getElementById('modalCustomerName');
  if (custNameEl) custNameEl.innerText = order.customer_id?.name || order.address?.fullName || 'Customer';

  const custEmailEl = document.getElementById('modalCustomerEmail');
  if (custEmailEl) custEmailEl.innerText = order.customer_id?.email || 'Registered Customer';

  const custPhoneEl = document.getElementById('modalCustomerPhone');
  if (custPhoneEl) custPhoneEl.innerText = `Phone: ${order.address?.phone || 'Not provided'}`;

  // Address
  const streetEl = document.getElementById('modalDeliveryStreet');
  if (streetEl) streetEl.innerText = order.address?.street || '';

  const cityStateEl = document.getElementById('modalDeliveryCityState');
  if (cityStateEl) {
    cityStateEl.innerText = `${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}`;
  }

  // Items breakdown
  const itemsContainer = document.getElementById('modalOrderItemsList');
  if (itemsContainer) {
    if (!order.items || order.items.length === 0) {
      itemsContainer.innerHTML = `<div class="p-4 text-center text-gray-400 text-xs">No items in this order.</div>`;
    } else {
      itemsContainer.innerHTML = order.items
        .map((item) => {
          const prod = item.product_id || {};
          const name = prod.name || 'Grocery Item';
          const img = prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80';
          const price = item.price || prod.price || 0;
          const qty = item.quantity || 1;
          const lineTotal = price * qty;

          return `
            <div class="flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition">
              <div class="flex items-center gap-3">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(name)}" class="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                <div>
                  <div class="font-bold text-gray-900 text-xs">${escapeHtml(name)}</div>
                  <div class="text-[11px] text-gray-500">${formatRupee(price)} &times; ${qty} unit${qty > 1 ? 's' : ''}</div>
                </div>
              </div>
              <div class="font-bold text-gray-900 text-xs">${formatRupee(lineTotal)}</div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Totals
  const subtotalEl = document.getElementById('modalSubtotal');
  if (subtotalEl) subtotalEl.innerText = formatRupee(order.total);

  const deliveryFeeEl = document.getElementById('modalDeliveryFee');
  if (deliveryFeeEl) deliveryFeeEl.innerText = 'FREE';

  const totalEl = document.getElementById('modalTotal');
  if (totalEl) totalEl.innerText = formatRupee(order.total);

  // Workflow actions inside modal
  const actionsEl = document.getElementById('modalOrderActions');
  if (actionsEl) {
    let actionButtons = '';

    if (order.status === 'Pending') {
      actionButtons = `
        <button 
          onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
          class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition border border-red-200"
        >
          Cancel Order (Auto-Restock)
        </button>
        <button 
          onclick="handleProgressOrder('${order._id}', 'Processing')" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          Confirm & Move to Packing &rarr;
        </button>
      `;
    } else if (order.status === 'Processing') {
      actionButtons = `
        <button 
          onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
          class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition border border-red-200"
        >
          Cancel Order (Auto-Restock)
        </button>
        <button 
          onclick="handleProgressOrder('${order._id}', 'Shipped')" 
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          Dispatch for Delivery &rarr;
        </button>
      `;
    } else if (order.status === 'Shipped') {
      actionButtons = `
        <button 
          onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
          class="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition border border-red-200"
        >
          Cancel Order (Auto-Restock)
        </button>
        <button 
          onclick="handleProgressOrder('${order._id}', 'Delivered')" 
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          Collect Cash on Delivery & Mark Delivered &rarr;
        </button>
      `;
    } else if (order.status === 'Delivered') {
      actionButtons = `
        <div class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 mr-auto">
          Completed: This order was successfully delivered and payment collected.
        </div>
      `;
    } else {
      actionButtons = `
        <div class="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 mr-auto">
          Cancelled: This order is cancelled and items were restored to catalog stock.
        </div>
      `;
    }

    actionsEl.innerHTML = `
      ${actionButtons}
      <button 
        onclick="closeOrderModal()" 
        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
      >
        Close
      </button>
    `;
  }
}

// --- ORDER STATUS TRANSITION HANDLER ---
async function handleProgressOrder(orderId, targetStatus) {
  if (targetStatus === 'Cancelled') {
    const ok = confirm(
      'Are you sure you want to cancel this order?\n\nCancelling will automatically restore product items and quantities back to the warehouse catalog stock.'
    );
    if (!ok) return;
  }

  try {
    const res = await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: targetStatus }),
    });

    showToast(`Order status updated to "${targetStatus}"`, 'success');

    // Reload products so that stock changes (e.g. from restock on cancel) reflect immediately
    await loadProducts();
    // Reload orders to update table, counters, and open modal
    await loadOrders();
  } catch (error) {
    console.error('Order status update error:', error);
    showToast(error.message || 'Failed to update order status', 'error');
  }
}

function updateMetrics() {
  const totalProductsEl = document.getElementById('metricTotalProducts');
  const outOfStockEl = document.getElementById('metricOutOfStock');
  const totalOrdersEl = document.getElementById('metricTotalOrders');
  const totalRevenueEl = document.getElementById('metricTotalRevenue');

  if (totalProductsEl) totalProductsEl.innerText = allAdminProducts.length;

  const outOfStockCount = allAdminProducts.filter((p) => p.stock <= 0).length;
  if (outOfStockEl) outOfStockEl.innerText = outOfStockCount;

  if (totalOrdersEl) totalOrdersEl.innerText = allAdminOrders.length;

  const revenue = allAdminOrders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  if (totalRevenueEl) totalRevenueEl.innerText = formatRupee(revenue);
}

// --- CREATE PRODUCT ---
async function handleAddProduct(e) {
  e.preventDefault();

  const name = document.getElementById('productName')?.value.trim();
  const category_id = document.getElementById('productCategorySelect')?.value;
  const price = document.getElementById('productPrice')?.value;
  const stock = document.getElementById('productStock')?.value;
  const image_url = document.getElementById('productImageUrl')?.value.trim();
  const description = document.getElementById('productDescription')?.value.trim();

  if (!name || !category_id || !price || !image_url) {
    showToast('Name, Category, Price and Image URL are required', 'error');
    return;
  }

  const submitBtn = document.getElementById('btnAddProductSubmit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner"></div><span>Adding...</span>`;
  }

  try {
    await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category_id,
        price: Number(price),
        stock: Number(stock) || 0,
        image_url,
        description,
      }),
    });

    showToast(`Product "${name}" created successfully!`, 'success');
    e.target.reset();
    await loadProducts();
  } catch (error) {
    console.error('Failed to add product:', error);
    showToast(error.message || 'Failed to add product', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Save Product</span>`;
    }
  }
}

// --- EDIT PRODUCT MODAL ---
function openEditModal(productId) {
  const product = allAdminProducts.find((p) => p._id === productId);
  if (!product) return;

  editingProductId = productId;
  document.getElementById('editProductId').value = productId;
  document.getElementById('editProductName').value = product.name;
  document.getElementById('editProductPrice').value = product.price;
  document.getElementById('editProductStock').value = product.stock;
  document.getElementById('editProductImageUrl').value = product.image_url;
  document.getElementById('editProductDescription').value = product.description || '';

  const catId = product.category_id && typeof product.category_id === 'object' ? product.category_id._id : product.category_id;
  const select = document.getElementById('editProductCategorySelect');
  if (select && catId) select.value = catId;

  document.getElementById('editProductModal').classList.remove('hidden');
}

function closeEditModal() {
  editingProductId = null;
  document.getElementById('editProductModal').classList.add('hidden');
}

async function handleUpdateProduct(e) {
  e.preventDefault();
  if (!editingProductId) return;

  const name = document.getElementById('editProductName')?.value.trim();
  const category_id = document.getElementById('editProductCategorySelect')?.value;
  const price = document.getElementById('editProductPrice')?.value;
  const stock = document.getElementById('editProductStock')?.value;
  const image_url = document.getElementById('editProductImageUrl')?.value.trim();
  const description = document.getElementById('editProductDescription')?.value.trim();

  try {
    await apiFetch(`/products/${editingProductId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        category_id,
        price: Number(price),
        stock: Number(stock),
        image_url,
        description,
      }),
    });

    showToast('Product updated successfully!', 'success');
    closeEditModal();
    await loadProducts();
  } catch (error) {
    console.error('Update product error:', error);
    showToast(error.message || 'Failed to update product', 'error');
  }
}

// --- DELETE PRODUCT ---
async function handleDeleteProduct(productId) {
  const prod = allAdminProducts.find((p) => p._id === productId);
  const productName = prod ? prod.name : 'this product';

  if (!confirm(`Are you sure you want to permanently delete "${productName}" from the catalog?`)) {
    return;
  }

  try {
    await apiFetch(`/products/${productId}`, {
      method: 'DELETE',
    });

    showToast(`Deleted "${productName}"`, 'info');
    await loadProducts();
  } catch (error) {
    console.error('Delete product error:', error);
    showToast(error.message || 'Failed to delete product', 'error');
  }
}

// --- CREATE CATEGORY ---
async function handleAddCategory(e) {
  e.preventDefault();
  const name = document.getElementById('newCategoryName')?.value.trim();
  const image_url = document.getElementById('newCategoryImageUrl')?.value.trim();

  if (!name || !image_url) {
    showToast('Category name and image URL are required', 'error');
    return;
  }

  try {
    await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, image_url }),
    });

    showToast(`Category "${name}" created!`, 'success');
    e.target.reset();
    closeCategoryModal();
    await loadCategories();
  } catch (error) {
    console.error('Create category error:', error);
    showToast(error.message || 'Failed to create category', 'error');
  }
}

function openCategoryModal() {
  document.getElementById('newCategoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('newCategoryModal').classList.add('hidden');
}

// --- UPDATE ORDER STATUS ---
async function handleOrderStatusChange(orderId, newStatus) {
  try {
    await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    showToast(`Order status updated to ${newStatus}`, 'success');
    await loadOrders();
  } catch (error) {
    console.error('Update order status error:', error);
    showToast(error.message || 'Failed to update order status', 'error');
  }
}

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.handleDeleteProduct = handleDeleteProduct;
window.handleOrderStatusChange = handleOrderStatusChange;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.handleProgressOrder = handleProgressOrder;
window.filterAdminOrdersByStatus = filterAdminOrdersByStatus;
window.handleAdminOrderSearch = handleAdminOrderSearch;

