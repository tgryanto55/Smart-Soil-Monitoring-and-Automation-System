// Login functionality
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

// Check if user is already logged in
if (localStorage.getItem('isLoggedIn') === 'true') {
  loginPage.style.display = 'none';
  dashboard.style.display = 'block';
}

// Handle login form submission
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // Simple authentication (in real app, this would be server-side)
  if (username === 'admin' && password === 'admin') {
    localStorage.setItem('isLoggedIn', 'true');
    loginPage.style.display = 'none';
    dashboard.style.display = 'block';
    showNotification('Login berhasil!');
  } else {
    showNotification('Username atau password salah!', 'error');
  }
});

// Handle logout
logoutBtn.addEventListener('click', function() {
  localStorage.removeItem('isLoggedIn');
  dashboard.style.display = 'none';
  loginPage.style.display = 'flex';
  showNotification('Anda telah logout', 'warning');
});