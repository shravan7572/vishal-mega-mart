/**
 * Vishal Mega Mart - Auth (login.js)
 */

let activeTab = 'login'; // 'login' or 'register'

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');

  // If already logged in, redirect
  if (isAuthenticated()) {
    const user = getUser();
    if (redirect) {
      window.location.href = redirect;
    } else if (user && user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
    return;
  }

  // Bind tab buttons
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  if (tabBtnLogin) {
    tabBtnLogin.addEventListener('click', () => switchTab('login'));
  }
  if (tabBtnRegister) {
    tabBtnRegister.addEventListener('click', () => switchTab('register'));
  }

  // Check URL query for default tab
  if (urlParams.get('tab') === 'register') {
    switchTab('register');
  }

  // Toggle admin key input based on role selection
  const regRoleSelect = document.getElementById('regRole');
  const adminKeyGroup = document.getElementById('adminKeyGroup');
  if (regRoleSelect && adminKeyGroup) {
    regRoleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'admin') {
        adminKeyGroup.classList.remove('hidden');
        document.getElementById('regAdminKey')?.focus();
      } else {
        adminKeyGroup.classList.add('hidden');
      }
    });
  }

  // Form listeners
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

function switchTab(tab) {
  activeTab = tab;
  const loginTabBtn = document.getElementById('tabBtnLogin');
  const registerTabBtn = document.getElementById('tabBtnRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTabBtn.className = 'flex-1 py-3 text-sm font-bold text-red-600 border-b-2 border-red-600 transition';
    registerTabBtn.className = 'flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTabBtn.className = 'flex-1 py-3 text-sm font-bold text-red-600 border-b-2 border-red-600 transition';
    loginTabBtn.className = 'flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition';
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

window.switchTab = switchTab;

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const submitBtn = document.getElementById('btnLoginSubmit');

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner"></div><span>Signing In...</span>`;
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      setAuth(data.token, data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');

      // Check redirect
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      setTimeout(() => {
        if (redirect) {
          window.location.href = redirect;
        } else if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 700);
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast(error.message || 'Invalid credentials', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In to Account</span>`;
    }
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const role = document.getElementById('regRole')?.value || 'customer';
  const submitBtn = document.getElementById('btnRegisterSubmit');

  if (!name || !email || !password) {
    showToast('Please fill out all registration fields', 'error');
    return;
  }

  if (password.length < 8) {
    showToast('Password must be at least 8 characters long', 'error');
    return;
  }

  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    showToast('Password must contain at least one letter and one number', 'error');
    return;
  }

  const payload = { name, email, password, role };

  // Validate admin security key if signing up as administrator
  if (role === 'admin') {
    const adminSecurityKey = document.getElementById('regAdminKey')?.value.trim();
    if (!adminSecurityKey) {
      showToast('Admin Security Password is required to create an Administrator account', 'error');
      document.getElementById('regAdminKey')?.focus();
      return;
    }
    payload.adminSecurityKey = adminSecurityKey;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner"></div><span>Creating Account...</span>`;
  }

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.success && data.token) {
      setAuth(data.token, data.user);
      showToast(`Account created successfully! Welcome, ${data.user.name}`, 'success');

      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      setTimeout(() => {
        if (redirect) {
          window.location.href = redirect;
        } else if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 700);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast(error.message || 'Failed to create account', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Account</span>`;
    }
  }
}
