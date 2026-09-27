const http = require('http');

// Helper to make local HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: process.env.PORT || 5050,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('[INFO] Starting Comprehensive API & Business Logic Verification Tests...\n');

  try {
    // 1. Health Check
    const health = await request('GET', '/health');
    console.log(`[PASS] [GET /health] Status: ${health.status}, State: ${health.data.database}`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. ZOD PASSWORD & AUTH VALIDATION TESTS
    console.log('\n--- 2. Zod Validation Tests ---');

    // Case 2A: Password too short (< 8 chars)
    const shortPassRes = await request('POST', '/api/auth/register', {
      name: 'Short Pass User',
      email: `shortpass_${Date.now()}@test.com`,
      password: 'Pass1',
      role: 'customer',
    });
    console.log(`[PASS] [Zod Validation] Short password rejected with ${shortPassRes.status} (Expected 400)`);
    if (shortPassRes.status !== 400) throw new Error('Zod failed to reject short password');

    // Case 2B: Password without numbers
    const noNumberRes = await request('POST', '/api/auth/register', {
      name: 'No Number User',
      email: `nonumber_${Date.now()}@test.com`,
      password: 'PasswordOnly',
      role: 'customer',
    });
    console.log(`[PASS] [Zod Validation] Password without numbers rejected with ${noNumberRes.status} (Expected 400)`);
    if (noNumberRes.status !== 400) throw new Error('Zod failed to reject password lacking numbers');

    // Case 2C: Password without letters
    const noLetterRes = await request('POST', '/api/auth/register', {
      name: 'No Letter User',
      email: `noletter_${Date.now()}@test.com`,
      password: '1234567890',
      role: 'customer',
    });
    console.log(`[PASS] [Zod Validation] Password without letters rejected with ${noLetterRes.status} (Expected 400)`);
    if (noLetterRes.status !== 400) throw new Error('Zod failed to reject password lacking letters');

    // Case 2D: Invalid email format
    const badEmailRes = await request('POST', '/api/auth/register', {
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'ValidPassword123',
      role: 'customer',
    });
    console.log(`[PASS] [Zod Validation] Invalid email rejected with ${badEmailRes.status} (Expected 400)`);
    if (badEmailRes.status !== 400) throw new Error('Zod failed to reject invalid email');

    // 3. ADMIN SECURITY KEY PROTECTION
    console.log('\n--- 3. Admin Security Key Tests ---');
    const unauthorizedAdmin = await request('POST', '/api/auth/register', {
      name: 'Hacker Admin',
      email: `fakeadmin_${Date.now()}@example.com`,
      password: 'Password123',
      role: 'admin',
      adminSecurityKey: 'wrong_secret_key',
    });
    console.log(`[PASS] [Admin Security] Unauthorized Admin rejected with ${unauthorizedAdmin.status} (Expected 403)`);
    if (unauthorizedAdmin.status !== 403) throw new Error('Security check failed: Admin registered without valid key!');

    const validAdminKey = process.env.ADMIN_SECURITY_KEY || 'vmm_admin_secret_pass_2025';
    const adminEmail = `storeadmin_${Date.now()}@vishalmegamart.com`;
    const adminRegister = await request('POST', '/api/auth/register', {
      name: 'Super Admin',
      email: adminEmail,
      password: 'AdminSecurePass123',
      role: 'admin',
      adminSecurityKey: validAdminKey,
    });
    console.log(`[PASS] [Admin Security] Authorized Admin created: ${adminRegister.status}, Role: ${adminRegister.data.user?.role}`);
    if (adminRegister.status !== 201 || adminRegister.data.user?.role !== 'admin') throw new Error('Authorized admin registration failed');
    const adminToken = adminRegister.data.token;

    // 4. CUSTOMER REGISTRATION & LOGIN
    console.log('\n--- 4. Customer Registration & Login Tests ---');
    const customerEmail = `customer_${Date.now()}@example.com`;
    const customerPass = 'CustomerPass123';
    const customerRegister = await request('POST', '/api/auth/register', {
      name: 'Priya Sharma',
      email: customerEmail,
      password: customerPass,
      role: 'customer',
    });
    console.log(`[PASS] [Customer Registration] Created: ${customerRegister.status}`);
    if (customerRegister.status !== 201 || !customerRegister.data.token) throw new Error('Customer registration failed');
    const customerToken = customerRegister.data.token;

    const customerLogin = await request('POST', '/api/auth/login', {
      email: customerEmail,
      password: customerPass,
    });
    console.log(`[PASS] [Customer Login] Status: ${customerLogin.status}, User: ${customerLogin.data.user?.name}`);
    if (customerLogin.status !== 200) throw new Error('Customer login failed');

    // 5. CATEGORIES & PRODUCTS
    console.log('\n--- 5. Catalog Tests ---');
    const categories = await request('GET', '/api/categories');
    console.log(`[PASS] [GET /api/categories] Found: ${categories.data.categories?.length} categories`);
    if (categories.status !== 200 || categories.data.categories.length === 0) throw new Error('Get categories failed');
    const sampleCategory = categories.data.categories[0];

    // Create a specific product for our stock tracking & order tests
    const testStockProduct = await request(
      'POST',
      '/api/products',
      {
        name: `Test Organic Honey ${Date.now()}`,
        category_id: sampleCategory._id,
        price: 250,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        description: 'Pure wildflower raw organic honey jar.',
      },
      adminToken
    );
    console.log(`[PASS] [Admin Create Product] Product created with Initial Stock: 20, ID: ${testStockProduct.data.product?._id}`);
    const testProdId = testStockProduct.data.product._id;

    // 6. COD PAYMENT ONLY ENFORCEMENT & ORDER CREATION
    console.log('\n--- 6. COD Enforcement & Order Creation ---');
    // Case 6A: Attempt to place an order with payment_method: "CARD" -> should be rejected
    const invalidPaymentOrder = await request(
      'POST',
      '/api/orders',
      {
        items: [{ product_id: testProdId, quantity: 2 }],
        address: {
          fullName: 'Priya Sharma',
          phone: '9876543210',
          street: '456 Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pinCode: '110001',
        },
        payment_method: 'CARD',
      },
      customerToken
    );
    console.log(`[PASS] [Order Payment Enforcement] Non-COD payment rejected with status ${invalidPaymentOrder.status} (Expected 400)`);
    if (invalidPaymentOrder.status !== 400) throw new Error('Order creation accepted non-COD payment method');

    // Case 6B: Place valid COD order for 3 items
    const validOrderRes = await request(
      'POST',
      '/api/orders',
      {
        items: [{ product_id: testProdId, quantity: 3 }],
        address: {
          fullName: 'Priya Sharma',
          phone: '9876543210',
          street: '456 Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pinCode: '110001',
        },
        payment_method: 'COD',
      },
      customerToken
    );
    console.log(`[PASS] [Order Placement] COD Order created: ${validOrderRes.status}, Total: Rs. ${validOrderRes.data.order?.total}`);
    if (validOrderRes.status !== 201) throw new Error('Create COD order failed: ' + JSON.stringify(validOrderRes.data));
    const testOrderId = validOrderRes.data.order._id;

    // Verify stock decremented: 20 - 3 = 17
    const prodAfterOrder = await request('GET', `/api/products/${testProdId}`);
    console.log(`[PASS] [Stock Verification] Stock after placing order: ${prodAfterOrder.data.product?.stock} (Expected 17)`);
    if (prodAfterOrder.data.product?.stock !== 17) throw new Error('Stock was not decremented correctly');

    // 7. GET SINGLE ORDER BY ID
    console.log('\n--- 7. Single Order Inspection ---');
    const singleOrderRes = await request('GET', `/api/orders/${testOrderId}`, null, customerToken);
    console.log(`[PASS] [GET /api/orders/:id] Status: ${singleOrderRes.status}, Order Ref: ${singleOrderRes.data.order?._id}`);
    if (singleOrderRes.status !== 200 || !singleOrderRes.data.order) throw new Error('Get order by ID failed');

    // 8. ORDER STATUS PIPELINE PROGRESSION
    console.log('\n--- 8. Admin Order Fulfillment Pipeline ---');
    // Pending -> Processing
    const toProcessing = await request('PATCH', `/api/orders/${testOrderId}/status`, { status: 'Processing' }, adminToken);
    console.log(`[PASS] [Status Transition] Pending -> Processing: ${toProcessing.status}, New Status: ${toProcessing.data.order?.status}`);
    if (toProcessing.status !== 200 || toProcessing.data.order?.status !== 'Processing') throw new Error('Transition to Processing failed');

    // Processing -> Shipped
    const toShipped = await request('PATCH', `/api/orders/${testOrderId}/status`, { status: 'Shipped' }, adminToken);
    console.log(`[PASS] [Status Transition] Processing -> Shipped: ${toShipped.status}, New Status: ${toShipped.data.order?.status}`);
    if (toShipped.status !== 200 || toShipped.data.order?.status !== 'Shipped') throw new Error('Transition to Shipped failed');

    // Shipped -> Delivered
    const toDelivered = await request('PATCH', `/api/orders/${testOrderId}/status`, { status: 'Delivered' }, adminToken);
    console.log(`[PASS] [Status Transition] Shipped -> Delivered: ${toDelivered.status}, New Status: ${toDelivered.data.order?.status}`);
    if (toDelivered.status !== 200 || toDelivered.data.order?.status !== 'Delivered') throw new Error('Transition to Delivered failed');

    // Delivered is terminal: cannot transition back to Pending
    const invalidRevert = await request('PATCH', `/api/orders/${testOrderId}/status`, { status: 'Pending' }, adminToken);
    console.log(`[PASS] [Invalid Transition] Delivered -> Pending rejected with ${invalidRevert.status} (Expected 400)`);
    if (invalidRevert.status !== 400) throw new Error('State machine failed to block transition from Delivered to Pending');

    // 9. ORDER CANCELLATION & AUTOMATIC STOCK RESTORATION
    console.log('\n--- 9. Order Cancellation & Auto Stock Restock ---');
    // Place a second order for 5 units: Stock 17 -> 12
    const secondOrder = await request(
      'POST',
      '/api/orders',
      {
        items: [{ product_id: testProdId, quantity: 5 }],
        address: {
          fullName: 'Priya Sharma',
          phone: '9876543210',
          street: '456 Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pinCode: '110001',
        },
        payment_method: 'COD',
      },
      customerToken
    );
    const secondOrderId = secondOrder.data.order._id;
    const stockAfterSecondOrder = await request('GET', `/api/products/${testProdId}`);
    console.log(`[PASS] Stock after 2nd order (qty 5): ${stockAfterSecondOrder.data.product?.stock} (Expected 12)`);
    if (stockAfterSecondOrder.data.product?.stock !== 12) throw new Error('Stock did not decrement to 12');

    // Admin cancels the second order -> Stock must be restored: 12 + 5 = 17
    const cancelOrderRes = await request('PATCH', `/api/orders/${secondOrderId}/status`, { status: 'Cancelled' }, adminToken);
    console.log(`[PASS] [Order Cancellation] Status: ${cancelOrderRes.status}, Order State: ${cancelOrderRes.data.order?.status}`);
    if (cancelOrderRes.status !== 200 || cancelOrderRes.data.order?.status !== 'Cancelled') throw new Error('Cancel order failed');

    const stockAfterCancellation = await request('GET', `/api/products/${testProdId}`);
    console.log(`[PASS] [Auto-Restock Verification] Stock after order cancellation: ${stockAfterCancellation.data.product?.stock} (Expected 17)`);
    if (stockAfterCancellation.data.product?.stock !== 17) throw new Error('Stock was not automatically restored after cancellation!');

    // Clean up test product
    await request('DELETE', `/api/products/${testProdId}`, null, adminToken);
    console.log(`[PASS] Cleaned up temporary test product.`);

    console.log('\n===============================================================');
    console.log('[ALL TESTS PASSED] Zod Auth, COD Enforcement, State Transitions,');
    console.log('Stock Auto-Restoration, and Admin Order Pipeline 100% Verified!');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[FAILED] Test execution error:', err.message);
    process.exit(1);
  }
}

// Wait 1.5 seconds and run tests
setTimeout(runTests, 1500);
