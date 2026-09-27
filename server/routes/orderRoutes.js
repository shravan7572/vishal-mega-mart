const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireAdmin, requireCustomer } = require('../middleware/auth');

// Customer routes
router.post('/', verifyToken, requireCustomer, orderController.createOrder);
router.get('/mine', verifyToken, requireCustomer, orderController.getMyOrders);

// Single Order Route (customer owner or admin)
router.get('/:id', verifyToken, orderController.getOrderById);

// Admin routes
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);
router.patch('/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router;
