/**
 * Vishal Mega Mart - Customer Orders (orders.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  if (!isAuthenticated()) {
    showToast('Please log in to view your orders', 'info');
    window.location.href = 'login.html?redirect=orders.html';
    return;
  }

  // Check if just placed order
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('orderPlaced') === 'true') {
    const banner = document.getElementById('orderPlacedBanner');
    if (banner) banner.classList.remove('hidden');
  }

  await loadMyOrders();
});

async function loadMyOrders() {
  const loadingEl = document.getElementById('ordersLoadingState');
  const emptyEl = document.getElementById('emptyOrdersState');
  const tableContainer = document.getElementById('ordersTableContainer');
  const tableBody = document.getElementById('ordersTableBody');
  const countBadge = document.getElementById('ordersCountBadge');

  try {
    const data = await apiFetch('/orders/mine');
    const orders = data.orders || [];

    if (loadingEl) loadingEl.classList.add('hidden');

    if (countBadge) {
      countBadge.innerText = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
    }

    if (orders.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');
      return;
    }

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');

    if (tableBody) {
      tableBody.innerHTML = orders
        .map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const statusClasses = getStatusBadgeClass(order.status);
          const shortId = order._id.substring(order._id.length - 8).toUpperCase();

          const itemsHtml = order.items
            .map(
              (item) => `
              <div class="flex items-center gap-2 text-xs py-1">
                ${
                  item.image_url
                    ? `<img src="${escapeHtml(item.image_url)}" class="w-8 h-8 rounded object-cover border border-gray-200" />`
                    : ''
                }
                <div class="truncate max-w-[180px]">
                  <span class="font-bold text-gray-900">${item.quantity}x</span> 
                  <span class="text-gray-700">${escapeHtml(item.name)}</span>
                </div>
                <span class="text-gray-400 ml-auto font-medium">${formatRupee(item.price * item.quantity)}</span>
              </div>
            `
            )
            .join('');

          return `
            <tr class="hover:bg-gray-50/80 transition border-b border-gray-100 last:border-b-0">
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">#${shortId}</span>
                <div class="text-[11px] text-gray-400 mt-1">${dateStr}</div>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  ${itemsHtml}
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="text-sm font-black text-gray-900">${formatRupee(order.total)}</div>
                <div class="mt-1">
                  <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    Cash on Delivery
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-gray-600 max-w-xs">
                <div class="font-semibold text-gray-900">${escapeHtml(order.address?.fullName || '')}</div>
                <div class="text-gray-500 truncate">${escapeHtml(order.address?.street || '')}, ${escapeHtml(order.address?.city || '')}</div>
                <div class="text-gray-400 text-[11px]">Ph: ${escapeHtml(order.address?.phone || '')}</div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusClasses}">
                  ${escapeHtml(order.status)}
                </span>
                ${
                  order.status === 'Pending'
                    ? '<div class="text-[10px] text-amber-700 mt-1">Awaiting confirmation</div>'
                    : order.status === 'Processing'
                    ? '<div class="text-[10px] text-blue-700 mt-1">Packing fresh items</div>'
                    : order.status === 'Shipped'
                    ? '<div class="text-[10px] text-indigo-700 mt-1">Out for delivery</div>'
                    : order.status === 'Delivered'
                    ? '<div class="text-[10px] text-emerald-700 mt-1">Delivered & paid</div>'
                    : '<div class="text-[10px] text-red-600 mt-1">Order cancelled</div>'
                }
              </td>
            </tr>
          `;
        })
        .join('');
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (loadingEl) loadingEl.classList.add('hidden');
    const msg = error.message || 'Failed to load your past orders.';
    showToast(msg, 'error');

    if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('unauthorized')) {
      setTimeout(() => {
        window.location.href = 'login.html?redirect=orders.html';
      }, 1500);
    }
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800';
    case 'Processing':
    case 'Shipped':
      return 'bg-blue-100 text-blue-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Pending':
    default:
      return 'bg-amber-100 text-amber-800';
  }
}
