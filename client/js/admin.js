/**
 * Vishal Mega Mart - Store Administration & Analytics Command Center
 * Supports: Sidebar Navigation, Real-time Sales Analytics, Today's Orders Pipeline, and Catalogue Inventory
 */

let allAdminProducts = [];
let allAdminCategories = [];
let allAdminOrders = [];
let currentAdminView = 'analytics';
let orderScope = 'today'; // 'today' or 'all'
let currentStatusFilter = 'All';
let orderSearchTerm = '';
let catalogSearchTerm = '';
let activeModalOrderId = null;
let editingProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Strict Authentication & Role Guard
  if (!isAuthenticated()) {
    showToast('Admin login required', 'error');
    window.location.href = 'login.html?redirect=admin.html';
    return;
  }

  if (!isAdmin()) {
    showToast('Access denied: Administrator privileges required', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
    return;
  }

  // Display admin profile
  const user = getUser();
  const nameEl = document.getElementById('sidebarAdminName');
  if (nameEl && user?.name) {
    nameEl.innerText = user.name;
  }

  // 2. Read view from URL hash if provided (#analytics, #today-orders, #catalogue)
  const hash = (window.location.hash || '').replace('#', '');
  if (['analytics', 'today-orders', 'catalogue'].includes(hash)) {
    currentAdminView = hash;
  }

  // Set initial view state
  switchAdminView(currentAdminView, false);

  // 3. Load live database assets
  await refreshAllAdminData();

  // 4. Attach Form Listeners
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', handleAddProduct);
  }

  const editProductForm = document.getElementById('editProductForm');
  if (editProductForm) {
    editProductForm.addEventListener('submit', handleUpdateProduct);
  }

  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', handleAddCategory);
  }
});

// --- VIEW NAVIGATION (SIDEBAR SWITCHING) ---
function switchAdminView(viewName, updateHash = true) {
  currentAdminView = viewName;
  if (updateHash) {
    window.location.hash = viewName;
  }

  // Close mobile sidebar if open
  toggleMobileSidebar(false);

  // Hide all views
  const viewAnalytics = document.getElementById('viewAnalytics');
  const viewTodayOrders = document.getElementById('viewTodayOrders');
  const viewCatalogue = document.getElementById('viewCatalogue');

  if (viewAnalytics) viewAnalytics.classList.add('hidden');
  if (viewTodayOrders) viewTodayOrders.classList.add('hidden');
  if (viewCatalogue) viewCatalogue.classList.add('hidden');

  // Reset sidebar active classes
  const navAnalytics = document.getElementById('navBtnAnalytics');
  const navTodayOrders = document.getElementById('navBtnTodayOrders');
  const navCatalogue = document.getElementById('navBtnCatalogue');

  const inactiveClass = 'sidebar-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-slate-300 hover:text-white hover:bg-slate-800/80';
  const activeClass = 'sidebar-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-white bg-red-600 shadow-sm';

  if (navAnalytics) navAnalytics.className = inactiveClass;
  if (navTodayOrders) navTodayOrders.className = inactiveClass;
  if (navCatalogue) navCatalogue.className = inactiveClass;

  const titleEl = document.getElementById('topViewTitle');
  const subEl = document.getElementById('topViewSubtitle');

  // Activate selected view
  if (viewName === 'analytics') {
    if (viewAnalytics) viewAnalytics.classList.remove('hidden');
    if (navAnalytics) navAnalytics.className = activeClass;
    if (titleEl) titleEl.innerText = 'Sales & Revenue Analytics';
    if (subEl) subEl.innerText = 'Real-time sales intelligence, revenue figures, and item velocity computed from MongoDB';
    loadAnalytics();
  } else if (viewName === 'today-orders') {
    if (viewTodayOrders) viewTodayOrders.classList.remove('hidden');
    if (navTodayOrders) navTodayOrders.className = activeClass;
    if (titleEl) titleEl.innerText = "Today's Orders & Fulfillment Pipeline";
    if (subEl) subEl.innerText = 'Manage incoming orders, advance fulfillment status, and collect Cash on Delivery';
    renderOrdersTable();
  } else if (viewName === 'catalogue') {
    if (viewCatalogue) viewCatalogue.classList.remove('hidden');
    if (navCatalogue) navCatalogue.className = activeClass;
    if (titleEl) titleEl.innerText = 'Catalogue & Inventory Management';
    if (subEl) subEl.innerText = 'Add products, update stock quantities, manage prices, and organize categories';
    renderProductsTable();
  }
}

// --- MOBILE SIDEBAR DRAWER TOGGLE ---
function toggleMobileSidebar(open) {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (open) {
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
  } else {
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }
}

// --- REFRESH ALL DATA ---
async function refreshAllAdminData() {
  const icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('animate-spin');

  try {
    await Promise.all([
      loadCategories(),
      loadProducts(),
      loadOrders(),
      loadAnalytics(),
    ]);
  } catch (err) {
    console.error('Data refresh error:', err);
  } finally {
    if (icon) icon.classList.remove('animate-spin');
  }
}

// --- 1. REAL SALES ANALYTICS (DATABASE AGGREGATION) ---
async function loadAnalytics() {
  try {
    const data = await apiFetch('/orders/analytics/overview');
    if (!data || !data.analytics) return;
    const a = data.analytics;

    // Revenue KPIs
    const revBigEl = document.getElementById('analyticsDeliveredRevenueBig');
    if (revBigEl) revBigEl.innerText = formatRupee(a.totalRevenue || 0);

    const revCountEl = document.getElementById('analyticsDeliveredOrdersCount');
    if (revCountEl) revCountEl.innerText = a.deliveredOrdersCount || 0;

    const totalSalesEl = document.getElementById('metricAnalyticsTotalSales');
    if (totalSalesEl) totalSalesEl.innerText = formatRupee(a.totalRevenue || 0);

    const todaySalesEl = document.getElementById('metricAnalyticsTodaySales');
    if (todaySalesEl) todaySalesEl.innerText = formatRupee(a.todaySales || 0);

    const todayGrossEl = document.getElementById('metricAnalyticsTodayGross');
    if (todayGrossEl) todayGrossEl.innerText = formatRupee(a.todayGrossVolume || 0);

    const aovEl = document.getElementById('metricAnalyticsAOV');
    if (aovEl) aovEl.innerText = formatRupee(a.averageOrderValue || 0);

    const unitsEl = document.getElementById('metricAnalyticsUnitsSold');
    if (unitsEl) unitsEl.innerText = a.totalUnitsSold || 0;

    // Secondary row
    const totalOrdersEl = document.getElementById('metricAnalyticsTotalOrdersCount');
    if (totalOrdersEl) totalOrdersEl.innerText = a.totalOrdersCount || 0;

    const todayOrdersEl = document.getElementById('metricAnalyticsTodayOrdersCount');
    if (todayOrdersEl) todayOrdersEl.innerText = a.todayOrdersCount || 0;

    const todayPendingEl = document.getElementById('metricAnalyticsTodayPendingCount');
    if (todayPendingEl) todayPendingEl.innerText = a.todayPendingCount || 0;

    const outStockEl = document.getElementById('metricAnalyticsOutOfStock');
    if (outStockEl) outStockEl.innerText = a.outOfStockCount || 0;

    // Sidebar & Scope Badges
    const sideTodayBadge = document.getElementById('sidebarTodayOrdersBadge');
    if (sideTodayBadge) sideTodayBadge.innerText = a.todayOrdersCount || 0;

    const scopeTodayCount = document.getElementById('scopeTodayCount');
    if (scopeTodayCount) scopeTodayCount.innerText = a.todayOrdersCount || 0;

    const scopeAllCount = document.getElementById('scopeAllCount');
    if (scopeAllCount) scopeAllCount.innerText = a.totalOrdersCount || 0;

    // Catalogue badges & metrics
    const sideCatBadge = document.getElementById('sidebarCatalogueBadge');
    if (sideCatBadge) sideCatBadge.innerText = a.totalProductsCount || 0;

    const catTotalEl = document.getElementById('catMetricTotal');
    if (catTotalEl) catTotalEl.innerText = a.totalProductsCount || 0;

    const catInStockEl = document.getElementById('catMetricInStock');
    if (catInStockEl) catInStockEl.innerText = Math.max(0, (a.totalProductsCount || 0) - (a.outOfStockCount || 0));

    const catLowStockEl = document.getElementById('catMetricLowStock');
    if (catLowStockEl) catLowStockEl.innerText = a.lowStockCount || 0;

    const catOutOfStockEl = document.getElementById('catMetricOutOfStock');
    if (catOutOfStockEl) catOutOfStockEl.innerText = a.outOfStockCount || 0;

    // Render 7-Day Trend Chart
    renderDailyTrendChart(a.dailyTrend || []);

    // Render Status Distribution Breakdown
    renderStatusBreakdown(a.statusCounts || {}, a.totalOrdersCount || 1);

    // Render Top Selling Products Leaderboard
    renderTopProductsLeaderboard(a.topSellingProducts || []);

  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

// 7-Day Trend Bar Chart
function renderDailyTrendChart(dailyTrend) {
  const container = document.getElementById('analyticsDailyTrendChart');
  if (!container) return;

  if (!dailyTrend || dailyTrend.length === 0) {
    container.innerHTML = `<div class="w-full text-center py-16 text-gray-400 text-xs">No daily sales recorded yet.</div>`;
    return;
  }

  const maxRevenue = Math.max(...dailyTrend.map((d) => d.revenue || 0), 1000);

  container.innerHTML = dailyTrend
    .map((day) => {
      const heightPercent = Math.max(8, Math.round(((day.revenue || 0) / maxRevenue) * 100));
      const isToday = day.date === new Date().toISOString().split('T')[0];

      const barBg = isToday
        ? 'bg-red-600 hover:bg-red-700'
        : (day.revenue > 0 ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-200');

      return `
        <div class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
          <!-- Tooltip on hover -->
          <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
            <div class="font-bold">${formatRupee(day.revenue)}</div>
            <div class="text-slate-400">${day.ordersCount} order${day.ordersCount !== 1 ? 's' : ''}</div>
          </div>

          <div class="text-[10px] font-bold text-gray-700 mb-1 opacity-0 group-hover:opacity-100 transition sm:opacity-100 truncate w-full text-center">
            ${day.revenue > 0 ? '₹' + day.revenue : '—'}
          </div>

          <!-- Bar -->
          <div 
            style="height: ${heightPercent}%;" 
            class="w-full max-w-[42px] ${barBg} rounded-t-lg transition-all duration-300"
          ></div>

          <!-- Day Label -->
          <div class="text-[10px] font-bold ${isToday ? 'text-red-600 font-black' : 'text-gray-500'} mt-2 truncate w-full text-center">
            ${escapeHtml(day.label)}
          </div>
        </div>
      `;
    })
    .join('');
}

// Status Breakdown
function renderStatusBreakdown(statusCounts, totalOrders) {
  const container = document.getElementById('analyticsStatusBreakdown');
  if (!container) return;

  const total = totalOrders || 1;
  const statuses = [
    { key: 'Pending', label: 'Pending', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
    { key: 'Processing', label: 'Processing', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-100' },
    { key: 'Shipped', label: 'Shipped', color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-100' },
    { key: 'Delivered', label: 'Delivered', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-100' },
    { key: 'Cancelled', label: 'Cancelled', color: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-100' },
  ];

  container.innerHTML = statuses
    .map((s) => {
      const data = statusCounts[s.key] || { count: 0, revenue: 0 };
      const pct = Math.round((data.count / total) * 100);

      return `
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold flex items-center gap-1.5 text-gray-800">
              <span class="w-2 h-2 rounded-full ${s.color}"></span>
              ${s.label}
            </span>
            <div class="space-x-2 text-right">
              <span class="font-bold text-gray-900">${data.count}</span>
              <span class="text-gray-400">(${pct}%)</span>
              <span class="font-semibold text-gray-600">${formatRupee(data.revenue)}</span>
            </div>
          </div>
          <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div class="${s.color} h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Top Selling Products Leaderboard
function renderTopProductsLeaderboard(topProducts) {
  const tableBody = document.getElementById('analyticsTopProductsTableBody');
  if (!tableBody) return;

  if (!topProducts || topProducts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="px-5 py-8 text-center text-gray-400">
          No customer purchases recorded yet. As orders are placed, top performers will rank here.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = topProducts
    .map((p, idx) => {
      const rankBadge = idx === 0 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        idx === 1 ? 'bg-gray-100 text-gray-800 border-gray-200' :
                        idx === 2 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100';

      return `
        <tr class="hover:bg-gray-50/80 transition">
          <td class="px-5 py-3">
            <div class="flex items-center gap-3">
              <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${rankBadge}">
                ${idx + 1}
              </span>
              <img 
                src="${escapeHtml(p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80')}" 
                alt="${escapeHtml(p.name)}" 
                class="w-9 h-9 object-cover rounded-lg border border-gray-200"
              />
              <div class="font-bold text-gray-900 text-xs">${escapeHtml(p.name)}</div>
            </div>
          </td>
          <td class="px-5 py-3 text-center">
            <span class="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">${p.quantity} units</span>
          </td>
          <td class="px-5 py-3 text-right font-black text-gray-900 text-xs">
            ${formatRupee(p.revenue)}
          </td>
        </tr>
      `;
    })
    .join('');
}

// --- 2. TODAY'S ORDERS & ALL-ORDERS PIPELINE ---
async function loadOrders() {
  try {
    const data = await apiFetch('/orders');
    allAdminOrders = data.orders || [];

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

function setOrderScope(scope) {
  orderScope = scope;

  const btnToday = document.getElementById('filterScopeToday');
  const btnAll = document.getElementById('filterScopeAll');

  if (scope === 'today') {
    if (btnToday) btnToday.className = 'px-3 py-1.5 rounded-lg bg-white text-red-600 shadow-sm transition font-bold';
    if (btnAll) btnAll.className = 'px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 transition font-bold';
  } else {
    if (btnToday) btnToday.className = 'px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 transition font-bold';
    if (btnAll) btnAll.className = 'px-3 py-1.5 rounded-lg bg-white text-red-600 shadow-sm transition font-bold';
  }

  updateOrderTabCounts();
  renderOrdersTable();
}

function updateOrderTabCounts() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const baseOrders = orderScope === 'today'
    ? allAdminOrders.filter((o) => new Date(o.createdAt) >= startOfToday)
    : allAdminOrders;

  const counts = {
    All: baseOrders.length,
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  baseOrders.forEach((o) => {
    if (counts[o.status] !== undefined) {
      counts[o.status]++;
    }
  });

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
        tabBtn.className = 'order-tab px-3 py-1.5 rounded-lg transition bg-red-50 text-red-700 font-bold';
      } else {
        tabBtn.className = 'order-tab px-3 py-1.5 rounded-lg transition text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold';
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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let filtered = orderScope === 'today'
    ? allAdminOrders.filter((o) => new Date(o.createdAt) >= startOfToday)
    : allAdminOrders;

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
            <p class="text-xs text-gray-400">
              ${orderScope === 'today' ? 'No orders placed today match this filter.' : 'No orders found.'}
            </p>
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

      // Workflow action buttons
      let workflowControls = '';
      if (order.status === 'Pending') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Processing')" 
            class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition border border-blue-200"
          >
            Pack Order
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
          >
            Cancel
          </button>
        `;
      } else if (order.status === 'Processing') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Shipped')" 
            class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition border border-indigo-200"
          >
            Dispatch
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
          >
            Cancel
          </button>
        `;
      } else if (order.status === 'Shipped') {
        workflowControls = `
          <button 
            onclick="handleProgressOrder('${order._id}', 'Delivered')" 
            class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition border border-emerald-200"
          >
            Deliver & Collect COD
          </button>
          <button 
            onclick="handleProgressOrder('${order._id}', 'Cancelled')" 
            class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition border border-red-200"
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

// Order Status Transition Handler
async function handleProgressOrder(orderId, targetStatus) {
  if (targetStatus === 'Cancelled') {
    const ok = confirm(
      'Are you sure you want to cancel this order?\n\nCancelling will automatically restore product items and quantities back to the warehouse catalog stock.'
    );
    if (!ok) return;
  }

  try {
    await apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: targetStatus }),
    });

    showToast(`Order status updated to "${targetStatus}"`, 'success');

    // Reload products so that stock changes (e.g. from restock on cancel) reflect immediately
    await loadProducts();
    // Reload orders to update table, counters, and open modal
    await loadOrders();
    // Reload analytics
    await loadAnalytics();
  } catch (error) {
    console.error('Order status update error:', error);
    showToast(error.message || 'Failed to update order status', 'error');
  }
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
        .map((step) => {
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

  // Customer & Shipping
  const custNameEl = document.getElementById('modalCustomerName');
  if (custNameEl) custNameEl.innerText = order.customer_id?.name || order.address?.fullName || 'Customer';

  const custEmailEl = document.getElementById('modalCustomerEmail');
  if (custEmailEl) custEmailEl.innerText = order.customer_id?.email || 'Registered Customer';

  const custPhoneEl = document.getElementById('modalCustomerPhone');
  if (custPhoneEl) custPhoneEl.innerText = `Phone: ${order.address?.phone || 'Not provided'}`;

  const streetEl = document.getElementById('modalDeliveryStreet');
  if (streetEl) streetEl.innerText = order.address?.street || '';

  const cityStateEl = document.getElementById('modalDeliveryCityState');
  if (cityStateEl) {
    cityStateEl.innerText = `${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}`;
  }

  // Itemized breakdown
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

// --- 3. CATALOGUE INVENTORY & PRODUCTS ---
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

async function loadProducts() {
  try {
    const data = await apiFetch('/products');
    allAdminProducts = data.products || [];
    renderProductsTable();
  } catch (err) {
    console.error('Failed to load admin products:', err);
  }
}

function handleCatalogProductSearch(term) {
  catalogSearchTerm = (term || '').trim().toLowerCase();
  renderProductsTable();
}

function renderProductsTable() {
  const tableBody = document.getElementById('adminProductsTableBody');
  if (!tableBody) return;

  let filtered = allAdminProducts;
  if (catalogSearchTerm) {
    filtered = filtered.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = p.category_id && typeof p.category_id === 'object' ? p.category_id.name.toLowerCase() : '';
      return name.includes(catalogSearchTerm) || cat.includes(catalogSearchTerm);
    });
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="py-8 text-center text-gray-400">No products found in the catalog.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .map((p) => {
      const catName = p.category_id && typeof p.category_id === 'object' ? p.category_id.name : 'Unknown';
      const isOutOfStock = p.stock <= 0;
      const isLowStock = p.stock > 0 && p.stock <= 10;

      const stockBadge = isOutOfStock
        ? `<span class="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Out of Stock (0)</span>`
        : isLowStock
        ? `<span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Low Stock (${p.stock})</span>`
        : `<span class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium">${p.stock} in stock</span>`;

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
}

// Add Product
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
    submitBtn.innerHTML = `<div class="spinner"></div><span>Saving...</span>`;
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

    showToast(`Product "${name}" saved to catalog!`, 'success');
    e.target.reset();
    await loadProducts();
    await loadAnalytics();
  } catch (error) {
    console.error('Failed to add product:', error);
    showToast(error.message || 'Failed to add product', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Save Product to Catalog</span>`;
    }
  }
}

// Edit Product Modal
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
    await loadAnalytics();
  } catch (error) {
    console.error('Update product error:', error);
    showToast(error.message || 'Failed to update product', 'error');
  }
}

// Delete Product
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
    await loadAnalytics();
  } catch (error) {
    console.error('Delete product error:', error);
    showToast(error.message || 'Failed to delete product', 'error');
  }
}

// Add Category
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

function handleLogout() {
  if (confirm('Are you sure you want to logout from Admin Central?')) {
    logout();
  }
}

// Global window attachments
window.switchAdminView = switchAdminView;
window.toggleMobileSidebar = toggleMobileSidebar;
window.refreshAllAdminData = refreshAllAdminData;
window.setOrderScope = setOrderScope;
window.filterAdminOrdersByStatus = filterAdminOrdersByStatus;
window.handleAdminOrderSearch = handleAdminOrderSearch;
window.handleCatalogProductSearch = handleCatalogProductSearch;
window.handleProgressOrder = handleProgressOrder;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.handleDeleteProduct = handleDeleteProduct;
window.handleLogout = handleLogout;
