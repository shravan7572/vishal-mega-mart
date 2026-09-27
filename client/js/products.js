/**
 * Vishal Mega Mart - Products Catalog (products.js)
 */

let allCategories = [];
let catalogProductsList = [];
let currentCategory = '';
let currentSearch = '';
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', async () => {
  // Read URL query params
  const urlParams = new URLSearchParams(window.location.search);
  currentCategory = urlParams.get('category') || '';
  currentSearch = urlParams.get('search') || '';

  // Initialize search input if query param exists
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput && currentSearch) {
    searchInput.value = currentSearch;
  }

  // Load categories and products
  await loadCategoriesDropdown();
  await fetchAndRenderProducts();

  // Attach search listeners
  const searchForm = document.getElementById('catalogSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentSearch = searchInput.value.trim();
      updateUrlAndFetch();
    });
  }

  const categorySelect = document.getElementById('categoryFilterSelect');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      updateUrlAndFetch();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchAndRenderProducts();
    });
  }
});

function updateUrlAndFetch() {
  const params = new URLSearchParams();
  if (currentCategory) params.set('category', currentCategory);
  if (currentSearch) params.set('search', currentSearch);

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);

  fetchAndRenderProducts();
}

async function loadCategoriesDropdown() {
  const select = document.getElementById('categoryFilterSelect');
  const pillsContainer = document.getElementById('categoryPills');
  if (!select) return;

  try {
    const data = await apiFetch('/categories');
    allCategories = data.categories || [];

    // Populate Select Dropdown
    select.innerHTML = `<option value="">All Categories</option>` +
      allCategories
        .map((cat) => `<option value="${escapeHtml(cat.name)}" ${cat.name.toLowerCase() === currentCategory.toLowerCase() ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`)
        .join('');

    // Populate Pills if container exists
    if (pillsContainer) {
      pillsContainer.innerHTML = `
        <button onclick="selectCategory('')" class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
          !currentCategory ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }">
          All
        </button>
        ${allCategories
          .map(
            (cat) => `
          <button onclick="selectCategory('${escapeHtml(cat.name)}')" class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              currentCategory.toLowerCase() === cat.name.toLowerCase()
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }">
            ${escapeHtml(cat.name)}
          </button>
        `
          )
          .join('')}
      `;
    }
  } catch (err) {
    console.error('Failed to load categories for filter:', err);
  }
}

function selectCategory(catName) {
  currentCategory = catName;
  const select = document.getElementById('categoryFilterSelect');
  if (select) select.value = catName;
  loadCategoriesDropdown();
  updateUrlAndFetch();
}

async function fetchAndRenderProducts() {
  const grid = document.getElementById('productsCatalogGrid');
  const countBadge = document.getElementById('productsCount');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full py-16 text-center">
      <div class="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm text-gray-500 font-medium">Fetching grocery items...</p>
    </div>
  `;

  try {
    let endpoint = `/products?sort=${encodeURIComponent(currentSort)}`;
    if (currentCategory) endpoint += `&category=${encodeURIComponent(currentCategory)}`;
    if (currentSearch) endpoint += `&search=${encodeURIComponent(currentSearch)}`;

    const data = await apiFetch(endpoint);
    catalogProductsList = data.products || [];
    const products = catalogProductsList;

    if (countBadge) {
      countBadge.innerText = `${products.length} product${products.length === 1 ? '' : 's'} found`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <h3 class="text-base font-bold text-gray-800 mb-1">No products found</h3>
          <p class="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            We couldn't find any groceries matching your selected criteria. Try resetting filters or searching for something else.
          </p>
          <button onclick="resetFilters()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map((p) => renderProductCard(p)).join('');
  } catch (error) {
    console.error('Error fetching products:', error);
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-red-600">
        <p class="font-bold">Failed to load products.</p>
        <p class="text-xs text-gray-500 mt-1">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

function renderProductCard(product) {
  const isOutOfStock = product.stock <= 0;
  const categoryName = product.category_id && typeof product.category_id === 'object' ? product.category_id.name : 'Grocery';

  return `
    <div class="product-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
      <a href="product.html?id=${product._id}" class="block relative group overflow-hidden bg-gray-50">
        <img 
          src="${escapeHtml(product.image_url)}" 
          alt="${escapeHtml(product.name)}" 
          class="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        ${
          isOutOfStock
            ? `<span class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow">Out of Stock</span>`
            : `<span class="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow">In Stock (${product.stock})</span>`
        }
      </a>
      
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span class="text-xs text-red-600 font-semibold uppercase tracking-wider block mb-1">
            ${escapeHtml(categoryName)}
          </span>
          <a href="product.html?id=${product._id}" class="hover:text-red-600 transition">
            <h3 class="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
              ${escapeHtml(product.name)}
            </h3>
          </a>
          <p class="text-xs text-gray-500 line-clamp-2 mb-3">
            ${escapeHtml(product.description || 'Quality grocery item.')}
          </p>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            <div class="text-lg font-black text-gray-900">${formatRupee(product.price)}</div>
            <div class="text-[10px] text-gray-400">Inclusive of taxes</div>
          </div>
          <button 
            onclick="handleQuickAdd('${product._id}')"
            ${isOutOfStock ? 'disabled' : ''}
            class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-95'
            }"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleQuickAdd(id) {
  const prod = catalogProductsList.find((p) => p._id === id);
  if (prod) {
    addToCart(prod, 1);
  }
}
window.handleQuickAdd = handleQuickAdd;

function resetFilters() {
  currentCategory = '';
  currentSearch = '';
  currentSort = 'newest';

  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = '';

  const catSelect = document.getElementById('categoryFilterSelect');
  if (catSelect) catSelect.value = '';

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'newest';

  loadCategoriesDropdown();
  updateUrlAndFetch();
}

window.selectCategory = selectCategory;
window.resetFilters = resetFilters;
