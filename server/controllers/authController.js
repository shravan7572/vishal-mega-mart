const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

// --- ZOD SCHEMAS ---
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(60, { message: 'Full name cannot exceed 60 characters' }),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
      message: 'Password must contain at least one letter and one number',
    }),
  role: z.enum(['customer', 'admin']).optional().default('customer'),
  adminSecurityKey: z.string().optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' }),
});

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'vishal_mega_mart_super_secret_jwt_key_2025';
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    { expiresIn: '30d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    // Validate request body using Zod schema
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstErrorMessage,
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, role, adminSecurityKey } = validation.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    let userRole = 'customer';
    if (role === 'admin') {
      const requiredKey = process.env.ADMIN_SECURITY_KEY || 'vmm_admin_secret_pass_2025';
      if (!adminSecurityKey || adminSecurityKey !== requiredKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Security Password. You are not authorized to create an Administrator account.',
        });
      }
      userRole = 'admin';
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
    });

    await newUser.save();

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    // Validate request body using Zod schema
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstErrorMessage,
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// GET /api/auth/me (optional verification route)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving user',
    });
  }
};
