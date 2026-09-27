const Category = require('../models/Category');

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
    });
  }
};

// POST /api/categories (admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, image_url } = req.body;

    if (!name || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Category name and image_url are required',
      });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = new Category({
      name: name.trim(),
      image_url: image_url.trim(),
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
};
