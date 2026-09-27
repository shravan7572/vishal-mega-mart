const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', categoryController.getCategories);
router.post('/', verifyToken, requireAdmin, categoryController.createCategory);

module.exports = router;
