const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

const sampleCategories = [
  {
    name: 'Fruits & Vegetables',
    image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Dairy & Bakery',
    image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Staples & Grains',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Snacks & Beverages',
    image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Personal Care',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Household & Cleaning',
    image_url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80',
  },
];

const sampleProducts = [
  // Fruits & Vegetables
  {
    categoryName: 'Fruits & Vegetables',
    name: 'Fresh Farm Apples (Royal Gala, 1kg)',
    price: 160,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, sweet, and juicy Royal Gala apples sourced directly from Himachal orchards. Rich in antioxidants and dietary fiber.',
  },
  {
    categoryName: 'Fruits & Vegetables',
    name: 'Fresh Organic Bananas (Robusta, 1 Dozen)',
    price: 65,
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally ripened Robusta bananas. Excellent source of potassium, vitamins, and instant natural energy.',
  },
  {
    categoryName: 'Fruits & Vegetables',
    name: 'Hybrid Farm Fresh Tomatoes (1kg)',
    price: 35,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    description: 'Plump, red, and juicy hybrid tomatoes ideal for curries, salads, purees, and everyday Indian gravies.',
  },
  {
    categoryName: 'Fruits & Vegetables',
    name: 'Fresh Baby Potatoes (1kg)',
    price: 40,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    description: 'Tender baby potatoes handpicked for dum aloo, roasting, and delicious curries. Low in sugar.',
  },

  // Dairy & Bakery
  {
    categoryName: 'Dairy & Bakery',
    name: 'Amul Taaza Homogenised Toned Milk (1 Litre)',
    price: 72,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    description: 'Amul Taaza toned milk is hygienically processed with zero bacteria and enriched with vitamins A & D.',
  },
  {
    categoryName: 'Dairy & Bakery',
    name: 'Fresh Malai Paneer (200g)',
    price: 95,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-soft, melt-in-mouth cottage cheese prepared from fresh cow and buffalo milk. High protein treat.',
  },
  {
    categoryName: 'Dairy & Bakery',
    name: 'Amul Salted Butter (500g)',
    price: 275,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80',
    description: 'The taste of India! Pure wholesome butter crafted from freshest cream, lightly salted for rich flavor.',
  },
  {
    categoryName: 'Dairy & Bakery',
    name: 'Multigrain Artisan Brown Bread (400g)',
    price: 55,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    description: 'Baked fresh every morning with oats, flax seeds, rye, and whole wheat. Zero preservatives.',
  },

  // Staples & Grains
  {
    categoryName: 'Staples & Grains',
    name: 'Fortune Sunlite Refined Sunflower Oil (1 Litre)',
    price: 135,
    stock: 70,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    description: 'Light, healthy cooking oil enriched with vitamins A and D. Great for deep frying and everyday cooking.',
  },
  {
    categoryName: 'Staples & Grains',
    name: 'Aashirvaad Superior Sharbati Atta (5kg)',
    price: 260,
    stock: 90,
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    description: '100% pure whole wheat flour milled from heavy golden Sharbati grains. Makes rotis soft and fluffy for hours.',
  },
  {
    categoryName: 'Staples & Grains',
    name: 'Daawat Rozana Super Basmati Rice (5kg)',
    price: 430,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: 'Aromatic long-grain aged Basmati rice with enticing fragrance and non-sticky fluffy texture.',
  },
  {
    categoryName: 'Staples & Grains',
    name: 'Tata Sampann Unpolished Toor Dal (1kg)',
    price: 175,
    stock: 65,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally nutritious unpolished toor dal without synthetic polish. High in dietary fiber and essential proteins.',
  },

  // Snacks & Beverages
  {
    categoryName: 'Snacks & Beverages',
    name: 'Tata Tea Gold Leaf Tea (500g)',
    price: 310,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Exquisite blend of CTC tea leaves with gently rolled 15% long leaves for rich taste and aroma.',
  },
  {
    categoryName: 'Snacks & Beverages',
    name: 'Cadbury Oreo Double Stuf Cookies (300g)',
    price: 90,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
    description: 'Crunchy chocolate wafers filled with double the amount of vanilla crème. Favorite snack for milk dunking.',
  },
  {
    categoryName: 'Snacks & Beverages',
    name: 'Haldiram Nagpur Aloo Bhujia (400g)',
    price: 110,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy and spiced potato and gram flour noodles. The quintessential spicy Indian teatime savory.',
  },

  // Personal Care
  {
    categoryName: 'Personal Care',
    name: 'Dettol Original Germ Protection Bathing Soap (Pack of 4, 125g each)',
    price: 198,
    stock: 55,
    image_url: 'https://images.unsplash.com/photo-1607006311825-243f8fa24639?auto=format&fit=crop&w=600&q=80',
    description: 'Trusted 99.9% germ protection soap bar with revitalizing pine fragrance for active family hygiene.',
  },
  {
    categoryName: 'Personal Care',
    name: 'Colgate Total Advanced Health Toothpaste (240g)',
    price: 185,
    stock: 75,
    image_url: 'https://images.unsplash.com/photo-1559591937-e17f54c2514c?auto=format&fit=crop&w=600&q=80',
    description: 'Comprehensive 12-hour antibacterial whole mouth protection against cavities, plaque, and bad breath.',
  },

  // Household & Cleaning
  {
    categoryName: 'Household & Cleaning',
    name: 'Surf Excel Matic Top Load Detergent Powder (2kg)',
    price: 420,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80',
    description: 'Engineered specifically for washing machines to remove tough stains without damaging fabric fibers or color.',
  },
  {
    categoryName: 'Household & Cleaning',
    name: 'Vim Dishwash Gel Lemon Fragrance (750ml Bottle)',
    price: 145,
    stock: 90,
    image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80',
    description: 'Powerful degreasing dishwash liquid gel with the freshness of real lemons. Removes tough oil with just 1 spoon.',
  },
];

async function seedData() {
  await Category.deleteMany({});
  await Product.deleteMany({});

  const categoryDocs = await Category.insertMany(sampleCategories);
  const categoryMap = {};
  categoryDocs.forEach((c) => {
    categoryMap[c.name] = c._id;
  });

  const productsToInsert = sampleProducts.map((p) => {
    return {
      name: p.name,
      category_id: categoryMap[p.categoryName],
      price: p.price,
      stock: p.stock,
      image_url: p.image_url,
      description: p.description,
    };
  });

  const productDocs = await Product.insertMany(productsToInsert);

  return { categoryDocs, productDocs };
}

module.exports = { seedData, sampleCategories, sampleProducts };
