const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin, requireCustomer } = require('../middleware/auth');

// Customer routes
router.post('/', verifyToken, requireCustomer, orderController.createOrder);
router.get('/mine', verifyToken, requireCustomer, orderController.getMyOrders);

// Admin analytics route (must be before /:id)
router.get('/analytics/overview', verifyToken, requireAdmin, orderController.getOrderAnalytics);

// Single Order Route (customer owner or admin)
router.get('/:id', verifyToken, orderController.getOrderById);

// Admin order routes
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);
router.patch('/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router;

