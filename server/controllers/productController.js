const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, search, featured, sort } = req.query;
    const query = {};

    // Filter by Category (accepts category ObjectId or category name)
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category_id = category;
      } else {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (cat) {
          query.category_id = cat._id;
        } else {
          return res.status(200).json({ success: true, count: 0, products: [] });
        }
      }
    }

    // Search by name or description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };

    let productQuery = Product.find(query).populate('category_id', 'name image_url').sort(sortOption);

    if (featured === 'true') {
      productQuery = productQuery.limit(8);
    }

    const products = await productQuery.exec();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
    });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id).populate('category_id', 'name image_url');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details',
    });
  }
};

// POST /api/products (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, category_id, price, image_url, description, stock } = req.body;

    if (!name || !category_id || price === undefined || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, category_id, price, and image_url are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID provided',
      });
    }

    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Specified category does not exist',
      });
    }

    const product = new Product({
      name: name.trim(),
      category_id,
      price: Number(price),
      image_url: image_url.trim(),
      description: description ? description.trim() : '',
      stock: stock !== undefined ? Number(stock) : 0,
    });

    await product.save();
    await product.populate('category_id', 'name image_url');

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// PUT /api/products/:id (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const { name, category_id, price, image_url, description, stock } = req.body;

    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID' });
      }
      const categoryExists = await Category.findById(category_id);
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category_id !== undefined) updateData.category_id = category_id;
    if (price !== undefined) updateData.price = Number(price);
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (stock !== undefined) updateData.stock = Number(stock);

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category_id', 'name image_url');

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// DELETE /api/products/:id (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};
