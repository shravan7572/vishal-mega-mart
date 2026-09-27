/**
 * Vishal Mega Mart - Homepage (index.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadFeaturedProducts();
});

async function loadCategories() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  try {
    const data = await apiFetch('/categories');
    const categories = data.categories || [];

    if (categories.length === 0) {
      container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-6">No categories available.</p>`;
      return;
    }

    container.innerHTML = categories
      .map(
        (cat) => `
        <a href="products.html?category=${encodeURIComponent(cat.name)}" 
           class="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md hover:border-red-300 transition duration-200 flex flex-col items-center">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 bg-red-50 flex items-center justify-center border-2 border-red-100 group-hover:scale-105 transition transform">
            <img src="${escapeHtml(cat.image_url)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <span class="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-1">
            ${escapeHtml(cat.name)}
          </span>
          <span class="text-xs text-red-500 font-medium mt-1">Shop Now &rarr;</span>
        </a>
      `
      )
      .join('');
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-4">Failed to load categories. Please ensure backend is running.</p>`;
  }
}

let featuredProductsList = [];

async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProductsGrid');
  if (!container) return;

  try {
    const data = await apiFetch('/products?featured=true');
    featuredProductsList = data.products || [];

    if (featuredProductsList.length === 0) {
      container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">No products found.</p>`;
      return;
    }

    container.innerHTML = featuredProductsList
      .map((p) => renderProductCard(p))
      .join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-8">Failed to load products.</p>`;
  }
}

function renderProductCard(product) {
  const isOutOfStock = product.stock <= 0;
  const categoryName = product.category_id && typeof product.category_id === 'object' ? product.category_id.name : 'Groceries';

  return `
    <div class="product-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
      <a href="product.html?id=${product._id}" class="block relative group overflow-hidden bg-gray-50">
        <img 
          src="${escapeHtml(product.image_url)}" 
          alt="${escapeHtml(product.name)}" 
          class="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition duration-300"
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
            <h3 class="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug mb-1">
              ${escapeHtml(product.name)}
            </h3>
          </a>
          <p class="text-xs text-gray-500 line-clamp-2 mb-3">
            ${escapeHtml(product.description || 'Fresh quality grocery delivered to your doorstep.')}
          </p>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            <div class="text-lg font-black text-gray-900">${formatRupee(product.price)}</div>
            <div class="text-[10px] text-gray-400 font-medium">Inclusive of all taxes</div>
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
  const prod = featuredProductsList.find((p) => p._id === id);
  if (prod) {
    addToCart(prod, 1);
  }
}
window.handleQuickAdd = handleQuickAdd;
