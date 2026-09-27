const http = require('http');

const pagesToTest = [
  '/',
  '/index.html',
  '/products.html',
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/orders.html',
  '/login.html',
  '/admin.html',
  '/404.html',
  '/css/styles.css',
  '/js/api.js',
  '/js/navbar.js',
  '/js/index.js',
  '/js/products.js',
  '/js/product.js',
  '/js/cart.js',
  '/js/checkout.js',
  '/js/orders.js',
  '/js/login.js',
  '/js/admin.js',
  '/health'
];

function testRoute(route) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: process.env.PORT || 5050,
      path: route,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          size: data.length,
          body: data
        });
      });
    }).on('error', err => reject(err));
  });
}

async function verifyAll() {
  console.log('[INFO] Verifying client page serving on Express port 5050...\n');
  let allPass = true;

  // 1. Verify all static pages and JS assets
  for (const page of pagesToTest) {
    try {
      const res = await testRoute(page);
      if (res.status === 200 && res.size > 0) {
        console.log(`[PASS] [${res.status}] ${page.padEnd(20)} (${res.contentType.split(';')[0]}, ${res.size} bytes)`);
      } else {
        console.error(`[FAIL] [${res.status}] ${page} FAILED (size: ${res.size})`);
        allPass = false;
      }
    } catch (err) {
      console.error(`[ERROR] Error fetching ${page}: ${err.message}`);
      allPass = false;
    }
  }

  // 2. Verify 404 page is returned with status 404 on unmapped route
  try {
    const res404 = await testRoute('/some-random-route-that-does-not-exist');
    if (res404.status === 404 && res404.body.includes('404')) {
      console.log(`\n[PASS] [${res404.status}] /some-random-route -> Served 404 Page correctly (${res404.size} bytes)`);
    } else {
      console.error(`[FAIL] Unmapped route did not return 404. Got: ${res404.status}`);
      allPass = false;
    }
  } catch (err) {
    console.error(`[ERROR] Error fetching 404 test: ${err.message}`);
    allPass = false;
  }

  if (allPass) {
    console.log('\n[SUCCESS] ALL CLIENT PAGES (INCLUDING 404 PAGE) AND ASSETS VERIFIED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAll();
