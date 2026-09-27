/**
 * Vishal Mega Mart - Product Details (product.js)
 */

let currentProduct = null;
let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    showProductNotFound('No product ID was provided.');
    return;
  }

  await loadProductDetails(productId);
});

async function loadProductDetails(productId) {
  const loadingEl = document.getElementById('productLoadingState');
  const detailsEl = document.getElementById('productDetailContent');

  try {
    const data = await apiFetch(`/products/${productId}`);
    currentProduct = data.product;

    if (!currentProduct) {
      showProductNotFound('Product not found or has been removed.');
      return;
    }

    renderProductView(currentProduct);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (detailsEl) detailsEl.classList.remove('hidden');

    // Load related products from same category
    if (currentProduct.category_id) {
      const catId = typeof currentProduct.category_id === 'object' ? currentProduct.category_id._id : currentProduct.category_id;
      loadRelatedProducts(catId, currentProduct._id);
    }
  } catch (error) {
    console.error('Error loading product:', error);
    showProductNotFound(error.message || 'Unable to load product details.');
  }
}

function renderProductView(product) {
  const isOutOfStock = product.stock <= 0;
  const categoryName = product.category_id && typeof product.category_id === 'object' ? product.category_id.name : 'Groceries';

  // Update Breadcrumbs
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbCategory) {
    breadcrumbCategory.innerText = categoryName;
    breadcrumbCategory.href = `products.html?category=${encodeURIComponent(categoryName)}`;
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.innerText = product.name;
  }

  // Update title & metadata
  document.title = `${product.name} - Vishal Mega Mart`;
  const nameEl = document.getElementById('productTitle');
  if (nameEl) nameEl.innerText = product.name;

  const catTagEl = document.getElementById('productCategoryTag');
  if (catTagEl) catTagEl.innerText = categoryName;

  const descEl = document.getElementById('productDescription');
  if (descEl) descEl.innerText = product.description || 'Hygienically packed premium grocery item guaranteed for maximum freshness and flavor.';

  const priceEl = document.getElementById('productPrice');
  if (priceEl) priceEl.innerText = formatRupee(product.price);

  const imgEl = document.getElementById('productImage');
  if (imgEl) {
    imgEl.src = product.image_url;
    imgEl.alt = product.name;
  }

  // Stock status
  const stockEl = document.getElementById('productStockBadge');
  if (stockEl) {
    if (isOutOfStock) {
      stockEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700';
      stockEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-600"></span> Out of Stock`;
    } else {
      stockEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
      stockEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600"></span> In Stock (${product.stock} available)`;
    }
  }

  // Quantity controls
  const qtyInput = document.getElementById('productQuantityInput');
  if (qtyInput) {
    qtyInput.value = selectedQuantity;
    qtyInput.max = product.stock || 1;
    if (isOutOfStock) qtyInput.disabled = true;
  }

  const addToCartBtn = document.getElementById('btnAddToCart');
  const buyNowBtn = document.getElementById('btnBuyNow');
  if (addToCartBtn) {
    addToCartBtn.disabled = isOutOfStock;
  }
  if (buyNowBtn) {
    buyNowBtn.disabled = isOutOfStock;
  }
}

function updateQuantity(change) {
  if (!currentProduct || currentProduct.stock <= 0) return;

  const newQty = selectedQuantity + change;
  if (newQty >= 1 && newQty <= currentProduct.stock) {
    selectedQuantity = newQty;
    const input = document.getElementById('productQuantityInput');
    if (input) input.value = selectedQuantity;
  } else if (newQty > currentProduct.stock) {
    showToast(`Maximum available stock is ${currentProduct.stock}`, 'error');
  }
}

function handleAddToCart() {
  if (!currentProduct) return;
  const success = addToCart(currentProduct, selectedQuantity);
  if (success) {
    selectedQuantity = 1;
    const input = document.getElementById('productQuantityInput');
    if (input) input.value = 1;
  }
}

function handleBuyNow() {
  if (!currentProduct) return;
  const success = addToCart(currentProduct, selectedQuantity);
  if (success) {
    window.location.href = 'checkout.html';
  }
}

async function loadRelatedProducts(categoryId, excludeId) {
  const container = document.getElementById('relatedProductsGrid');
  if (!container) return;

  try {
    const data = await apiFetch(`/products?category=${categoryId}`);
    const filtered = (data.products || []).filter((p) => p._id !== excludeId).slice(0, 4);

    if (filtered.length === 0) {
      document.getElementById('relatedProductsSection')?.classList.add('hidden');
      return;
    }

    container.innerHTML = filtered
      .map(
        (p) => `
        <div class="product-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <a href="product.html?id=${p._id}" class="block relative overflow-hidden bg-gray-50 group">
            <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" class="w-full h-40 object-cover group-hover:scale-105 transition duration-300" />
          </a>
          <div class="p-3 flex-1 flex flex-col justify-between">
            <a href="product.html?id=${p._id}" class="hover:text-red-600 transition">
              <h4 class="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 mb-1">${escapeHtml(p.name)}</h4>
            </a>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span class="text-sm font-black text-gray-900">${formatRupee(p.price)}</span>
              <a href="product.html?id=${p._id}" class="text-xs text-red-600 font-bold hover:underline">View &rarr;</a>
            </div>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load related products:', err);
  }
}

function showProductNotFound(message) {
  const loadingEl = document.getElementById('productLoadingState');
  const detailsEl = document.getElementById('productDetailContent');
  if (loadingEl) loadingEl.classList.add('hidden');
  if (detailsEl) detailsEl.classList.add('hidden');

  const errorContainer = document.getElementById('productErrorState');
  if (errorContainer) {
    errorContainer.classList.remove('hidden');
    document.getElementById('errorMessage').innerText = message;
  }
}

window.updateQuantity = updateQuantity;
window.handleAddToCart = handleAddToCart;
window.handleBuyNow = handleBuyNow;
