//auth.js
/**
 * Authentication management for Floorplan Editor
 */

const API_BASE_URL = 'http://localhost:4000/api';
const TOKEN_KEY = 'floorplan_auth_token';
const REFRESH_KEY = 'floorplan_refresh_token';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('login-overlay');
  const branchOverlay = document.getElementById('branch-overlay');
  const mainApp = document.getElementById('main-app');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');
  const branchList = document.getElementById('branch-list');
  const branchLoading = document.getElementById('branch-loading');
  const branchError = document.getElementById('branch-error');

  // Check if already authenticated
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    showBranchSelection();
  }

  // Handle Login Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    loginError.style.display = 'none';
    btnLogin.disabled = true;
    btnLogin.textContent = 'Signing in...';
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        const tokens = data.data;
        if (tokens.accessToken) {
          localStorage.setItem(TOKEN_KEY, tokens.accessToken);
        }
        if (tokens.refreshToken) {
          localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        }
        
        showBranchSelection();
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      loginError.textContent = err.message || 'Failed to connect to the server';
      loginError.style.display = 'block';
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Sign In';
    }
  });

  async function showBranchSelection() {
    loginOverlay.style.display = 'none';
    branchOverlay.style.display = 'flex';
    mainApp.style.display = 'none';
    
    branchList.innerHTML = '';
    branchLoading.style.display = 'block';
    branchError.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/branches/managed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to load branches');
      }

      const data = await response.json();
      const branches = data.data || [];
      branchLoading.style.display = 'none';

      if (branches.length === 0) {
        branchError.textContent = 'You do not manage any branches.';
        branchError.style.display = 'block';
        return;
      }

      branches.forEach(branch => {
        const card = document.createElement('div');
        card.className = 'branch-card';
        card.innerHTML = `
          <div class="branch-info">
            <h4>${branch.name}</h4>
            <p>${branch.city || 'No Location'}</p>
          </div>
          <div>➡️</div>
        `;
        card.addEventListener('click', async () => {
          try {
            await showApp(branch.id);
          } catch (err) {
            branchError.textContent = err.message || 'Failed to load the selected branch';
            branchError.style.display = 'block';
          }
        });
        branchList.appendChild(card);
      });

    } catch (err) {
      branchLoading.style.display = 'none';
      branchError.textContent = err.message || 'Failed to load branches';
      branchError.style.display = 'block';
    }
  }

  function showApp(branchId) {
    branchOverlay.style.display = 'none';
    mainApp.style.display = 'grid'; 
    
    // We will initiate the dynamic loading from App state soon
    if (typeof loadDynamicFloorplan === 'function') {
      loadDynamicFloorplan(branchId);
    }
    
    if (typeof resizeCanvas === 'function') {
      setTimeout(resizeCanvas, 50);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    mainApp.style.display = 'none';
    branchOverlay.style.display = 'none';
    loginOverlay.style.display = 'flex';
  }

  // Handle Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
  
  const btnLogoutBranch = document.getElementById('btn-logout-branch');
  if (btnLogoutBranch) btnLogoutBranch.addEventListener('click', logout);
});
