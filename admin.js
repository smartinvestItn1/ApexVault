// ========== APEXVAULT ADMIN JAVASCRIPT ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBt77e2QQCtOyCVCupw-6jIJ8MVyHf3UKY",
  authDomain: "apexvault-eea2a.firebaseapp.com",
  databaseURL: "https://apexvault-eea2a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "apexvault-eea2a",
  storageBucket: "apexvault-eea2a.firebasestorage.app",
  messagingSenderId: "153560225073",
  appId: "1:153560225073:web:10fcd76eb82cebd8f18c10",
  measurementId: "G-E5QQK8RBTN"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ========== GLOBAL STATE ==========
let allUsers = {};
let allDeposits = {};
let allWithdrawals = {};
let allTransactions = [];
let platformSettings = {};

// ========== CHECK ADMIN LOGIN ==========
function checkAdmin() {
  const userJson = sessionStorage.getItem('apexvault_user');
  if (!userJson) {
    window.location.href = 'login.html';
    return false;
  }
  const user = JSON.parse(userJson);
  // For demo, any logged-in user can access admin
  // In production, check user.role === 'admin'
  return true;
}

// ========== LOAD ALL DATA ==========
async function loadAllData() {
  // Load users
  const usersSnap = await get(ref(db, 'users'));
  allUsers = usersSnap.val() || {};
  
  // Load platform settings
  const settingsSnap = await get(ref(db, 'platformSettings'));
  platformSettings = settingsSnap.val() || {
    transferEnabled: true,
    investEnabled: true,
    withdrawEnabled: true
  };
  
  // Load pending deposits
  const depositsSnap = await get(ref(db, 'pendingDeposits'));
  allDeposits = depositsSnap.val() || {};
  
  // Load pending withdrawals
  const withdrawalsSnap = await get(ref(db, 'pendingWithdrawals'));
  allWithdrawals = withdrawalsSnap.val() || {};
  
  // Update stats
  updateStats();
  
  // Update settings toggles
  updateToggles();
  
  // Render tables
  renderDeposits();
  renderWithdrawals();
  renderUsers();
  renderTransactions();
}

// ========== UPDATE STATS ==========
function updateStats() {
  const userCount = Object.keys(allUsers).length;
  
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  
  for (const d of Object.values(allDeposits)) {
    if (d.status === 'approved') totalDeposits += d.amount;
    if (d.status === 'pending') pendingDeposits++;
  }
  
  for (const w of Object.values(allWithdrawals)) {
    if (w.status === 'approved') totalWithdrawals += w.amount;
    if (w.status === 'pending') pendingWithdrawals++;
  }
  
  const totalPending = pendingDeposits + pendingWithdrawals;
  
  let blockedCount = 0;
  if (!platformSettings.transferEnabled) blockedCount++;
  if (!platformSettings.investEnabled) blockedCount++;
  if (!platformSettings.withdrawEnabled) blockedCount++;
  
  document.getElementById('totalUsers').textContent = userCount;
  document.getElementById('totalDeposits').textContent = '$' + totalDeposits.toLocaleString();
  document.getElementById('totalWithdrawals').textContent = '$' + totalWithdrawals.toLocaleString();
  document.getElementById('totalPending').textContent = totalPending;
  document.getElementById('quickPendingDeposits').textContent = pendingDeposits;
  document.getElementById('quickPendingWithdrawals').textContent = pendingWithdrawals;
  document.getElementById('blockedFeatures').textContent = blockedCount;
}

// ========== UPDATE TOGGLES ==========
function updateToggles() {
  document.getElementById('transferToggle').checked = platformSettings.transferEnabled !== false;
  document.getElementById('investToggle').checked = platformSettings.investEnabled !== false;
  document.getElementById('withdrawToggle').checked = platformSettings.withdrawEnabled !== false;
}

// ========== TOGGLE FEATURE ==========
window.toggleFeature = async function(feature) {
  const checkbox = document.getElementById(feature + 'Toggle');
  const enabled = checkbox.checked;
  
  try {
    await update(ref(db, 'platformSettings'), {
      [feature + 'Enabled']: enabled
    });
    
    platformSettings[feature + 'Enabled'] = enabled;
    updateStats();
    
    alert((enabled ? '✅ Enabled' : '🚫 Blocked') + ' ' + feature);
  } catch (error) {
    alert('❌ Error: ' + error.message);
    checkbox.checked = !enabled;
  }
};

// ========== SECTION NAVIGATION ==========
window.showSection = function(sectionName) {
  document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
  const section = document.getElementById(sectionName + 'Section');
  if (section) section.style.display = 'block';
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.target.closest('.nav-item').classList.add('active');
  
  const titles = {
    overview: 'Admin Dashboard',
    pendingDeposits: 'Pending Deposits',
    pendingWithdrawals: 'Pending Withdrawals',
    users: 'All Users',
    transactions: 'All Transactions',
    settings: 'Feature Controls'
  };
  document.getElementById('pageTitle').textContent = titles[sectionName] || 'Admin';
  
  document.getElementById('sidebar').classList.remove('open');
};

// ========== MOBILE SIDEBAR ==========
window.toggleMobileSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};

// ========== RENDER DEPOSITS ==========
function renderDeposits() {
  const container = document.getElementById('depositsTable');
  const deposits = Object.entries(allDeposits);
  
  if (deposits.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">💰</div><p>No deposit requests found</p></div>';
    return;
  }
  
  let html = `<table class="data-table"><thead><tr>
    <th>User</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th>
  </tr></thead><tbody>`;
  
  for (const [id, d] of deposits) {
    const statusClass = d.status === 'pending' ? 'badge-pending' : d.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = d.status === 'pending' 
      ? `<div class="action-btns">
          <button class="btn-action btn-approve" onclick="approveDeposit('${id}')">Approve</button>
          <button class="btn-action btn-reject" onclick="rejectDeposit('${id}')">Reject</button>
         </div>`
      : '<span style="color: var(--text-muted);">Completed</span>';
    
    html += `<tr>
      <td><div class="user-cell"><div class="user-avatar">${(d.userName || 'U').charAt(0)}</div><div>${d.userName || 'Unknown'}<br><small style="color: var(--text-muted);">${d.userEmail || ''}</small></div></div></td>
      <td style="color: var(--success); font-weight: 600;">+$${d.amount.toLocaleString()}</td>
      <td>${d.method || 'N/A'}</td>
      <td>${new Date(d.date).toLocaleDateString()}</td>
      <td><span class="badge ${statusClass}">${d.status.toUpperCase()}</span></td>
      <td>${actions}</td>
    </tr>`;
  }
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ========== FILTER DEPOSITS ==========
window.filterDeposits = function() {
  const search = document.getElementById('depositSearch').value.toLowerCase();
  const filter = document.getElementById('depositFilter').value;
  const rows = document.querySelectorAll('#depositsTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.querySelector('.badge')?.textContent.toLowerCase() || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || status === filter;
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== APPROVE DEPOSIT ==========
window.approveDeposit = async function(depositId) {
  if (!confirm('Approve this deposit?')) return;
  
  try {
    const deposit = allDeposits[depositId];
    if (!deposit) return;
    
    // Update deposit status
    await update(ref(db, 'pendingDeposits/' + depositId), { status: 'approved' });
    await update(ref(db, 'users/' + deposit.userId + '/pendingDeposits/' + depositId), { status: 'approved' });
    
    // Add to user balance
    const userSnap = await get(ref(db, 'users/' + deposit.userId));
    const user = userSnap.val() || {};
    await update(ref(db, 'users/' + deposit.userId), {
      balance: (user.balance || 0) + deposit.amount
    });
    
    // Add transaction
    await push(ref(db, 'users/' + deposit.userId + '/transactions'), {
      type: 'deposit',
      amount: deposit.amount,
      method: deposit.method,
      status: 'completed',
      date: new Date().toISOString()
    });
    
    allDeposits[depositId].status = 'approved';
    updateStats();
    renderDeposits();
    alert('✅ Deposit approved!');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== REJECT DEPOSIT ==========
window.rejectDeposit = async function(depositId) {
  if (!confirm('Reject this deposit?')) return;
  
  try {
    await update(ref(db, 'pendingDeposits/' + depositId), { status: 'rejected' });
    await update(ref(db, 'users/' + allDeposits[depositId].userId + '/pendingDeposits/' + depositId), { status: 'rejected' });
    
    allDeposits[depositId].status = 'rejected';
    updateStats();
    renderDeposits();
    alert('🚫 Deposit rejected!');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== RENDER WITHDRAWALS ==========
function renderWithdrawals() {
  const container = document.getElementById('withdrawalsTable');
  const withdrawals = Object.entries(allWithdrawals);
  
  if (withdrawals.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">💸</div><p>No withdrawal requests found</p></div>';
    return;
  }
  
  let html = `<table class="data-table"><thead><tr>
    <th>User</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th>
  </tr></thead><tbody>`;
  
  for (const [id, w] of withdrawals) {
    const statusClass = w.status === 'pending' ? 'badge-pending' : w.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = w.status === 'pending'
      ? `<div class="action-btns">
          <button class="btn-action btn-approve" onclick="approveWithdrawal('${id}')">Approve</button>
          <button class="btn-action btn-reject" onclick="rejectWithdrawal('${id}')">Reject</button>
         </div>`
      : '<span style="color: var(--text-muted);">Completed</span>';
    
    html += `<tr>
      <td><div class="user-cell"><div class="user-avatar">${(w.userName || 'U').charAt(0)}</div><div>${w.userName || 'Unknown'}<br><small style="color: var(--text-muted);">${w.userEmail || ''}</small></div></div></td>
      <td style="color: var(--danger); font-weight: 600;">-$${w.amount.toLocaleString()}</td>
      <td>${w.method || 'N/A'}</td>
      <td>${new Date(w.date).toLocaleDateString()}</td>
      <td><span class="badge ${statusClass}">${w.status.toUpperCase()}</span></td>
      <td>${actions}</td>
    </tr>`;
  }
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ========== FILTER WITHDRAWALS ==========
window.filterWithdrawals = function() {
  const search = document.getElementById('withdrawSearch').value.toLowerCase();
  const filter = document.getElementById('withdrawFilter').value;
  const rows = document.querySelectorAll('#withdrawalsTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.querySelector('.badge')?.textContent.toLowerCase() || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || status === filter;
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== APPROVE WITHDRAWAL ==========
window.approveWithdrawal = async function(withdrawalId) {
  if (!confirm('Approve this withdrawal?')) return;
  
  try {
    const withdrawal = allWithdrawals[withdrawalId];
    if (!withdrawal) return;
    
    // Update status
    await update(ref(db, 'pendingWithdrawals/' + withdrawalId), { status: 'approved' });
    await update(ref(db, 'users/' + withdrawal.userId + '/pendingWithdrawals/' + withdrawalId), { status: 'approved' });
    
    // Add transaction
    await push(ref(db, 'users/' + withdrawal.userId + '/transactions'), {
      type: 'withdraw',
      amount: withdrawal.amount,
      method: withdrawal.method,
      status: 'completed',
      date: new Date().toISOString()
    });
    
    allWithdrawals[withdrawalId].status = 'approved';
    updateStats();
    renderWithdrawals();
    alert('✅ Withdrawal approved!');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== REJECT WITHDRAWAL ==========
window.rejectWithdrawal = async function(withdrawalId) {
  if (!confirm('Reject this withdrawal? Money will be refunded to user.')) return;
  
  try {
    const withdrawal = allWithdrawals[withdrawalId];
    
    // Refund user
    const userSnap = await get(ref(db, 'users/' + withdrawal.userId));
    const user = userSnap.val() || {};
    await update(ref(db, 'users/' + withdrawal.userId), {
      balance: (user.balance || 0) + withdrawal.amount
    });
    
    // Update status
    await update(ref(db, 'pendingWithdrawals/' + withdrawalId), { status: 'rejected' });
    await update(ref(db, 'users/' + withdrawal.userId + '/pendingWithdrawals/' + withdrawalId), { status: 'rejected' });
    
    allWithdrawals[withdrawalId].status = 'rejected';
    updateStats();
    renderWithdrawals();
    alert('🚫 Withdrawal rejected! Money refunded.');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== RENDER USERS ==========
function renderUsers() {
  const container = document.getElementById('usersTable');
  const users = Object.entries(allUsers);
  
  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">👥</div><p>No users found</p></div>';
    return;
  }
  
  let html = `<table class="data-table"><thead><tr>
    <th>User</th><th>Balance</th><th>Invested</th><th>Profit</th><th>Joined</th><th>Actions</th>
  </tr></thead><tbody>`;
  
  for (const [id, u] of users) {
    const hasInvestment = u.investments && Object.keys(u.investments).length > 0;
    html += `<tr data-has-investment="${hasInvestment}">
      <td><div class="user-cell"><div class="user-avatar">${(u.fullName || 'U').charAt(0)}</div><div>${u.fullName || 'Unknown'}<br><small style="color: var(--text-muted);">${u.email || ''}</small></div></div></td>
      <td>$${(u.balance || 0).toLocaleString()}</td>
      <td>$${(u.totalInvested || 0).toLocaleString()}</td>
      <td style="color: var(--success);">$${(u.totalProfit || 0).toLocaleString()}</td>
      <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td><button class="btn-action btn-view" onclick="viewUser('${id}')">View</button></td>
    </tr>`;
  }
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ========== FILTER USERS ==========
window.filterUsers = function() {
  const search = document.getElementById('userSearch').value.toLowerCase();
  const filter = document.getElementById('userFilter').value;
  const rows = document.querySelectorAll('#usersTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const hasInvestment = row.getAttribute('data-has-investment') === 'true';
    const matchSearch = text.includes(search);
    let matchFilter = true;
    
    if (filter === 'withInvestment') matchFilter = hasInvestment;
    if (filter === 'noInvestment') matchFilter = !hasInvestment;
    
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== VIEW USER ==========
window.viewUser = function(userId) {
  const user = allUsers[userId];
  if (!user) return;
  
  alert(`User: ${user.fullName || 'N/A'}\nEmail: ${user.email || 'N/A'}\nPhone: ${user.phone || 'N/A'}\nBalance: $${(user.balance || 0).toLocaleString()}\nInvested: $${(user.totalInvested || 0).toLocaleString()}\nProfit: $${(user.totalProfit || 0).toLocaleString()}`);
};

// ========== RENDER TRANSACTIONS ==========
function renderTransactions() {
  const container = document.getElementById('transactionsTable');
  allTransactions = [];
  
  for (const [userId, user] of Object.entries(allUsers)) {
    if (user.transactions) {
      for (const [txId, tx] of Object.entries(user.transactions)) {
        allTransactions.push({ ...tx, userId, userName: user.fullName, txId });
      }
    }
  }
  
  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (allTransactions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No transactions found</p></div>';
    return;
  }
  
  let html = `<table class="data-table"><thead><tr>
    <th>User</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th>
  </tr></thead><tbody>`;
  
  for (const tx of allTransactions) {
    const typeColors = { deposit: 'var(--success)', withdraw: 'var(--danger)', invest: 'var(--info)', transfer_out: 'var(--danger)', transfer_in: 'var(--success)' };
    const typeLabels = { deposit: 'Deposit', withdraw: 'Withdraw', invest: 'Invest', transfer_out: 'Transfer Out', transfer_in: 'Transfer In' };
    const color = typeColors[tx.type] || 'var(--text-light)';
    const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' ? '-' : '+';
    
    html += `<tr data-type="${tx.type}">
      <td><div class="user-cell"><div class="user-avatar">${(tx.userName || 'U').charAt(0)}</div><div>${tx.userName || 'Unknown'}</div></div></td>
      <td style="color: ${color};">${typeLabels[tx.type] || tx.type}</td>
      <td style="color: ${color}; font-weight: 600;">${sign}$${tx.amount.toLocaleString()}</td>
      <td>${new Date(tx.date).toLocaleDateString()}</td>
      <td><span class="badge badge-approved">${tx.status.toUpperCase()}</span></td>
    </tr>`;
  }
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ========== FILTER TRANSACTIONS ==========
window.filterTransactions = function() {
  const search = document.getElementById('txSearch').value.toLowerCase();
  const filter = document.getElementById('txFilter').value;
  const rows = document.querySelectorAll('#transactionsTable tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const type = row.getAttribute('data-type') || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || type === filter || (filter === 'transfer' && (type === 'transfer_in' || type === 'transfer_out'));
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== LOGOUT ==========
window.logout = function() {
  sessionStorage.removeItem('apexvault_user');
  window.location.href = 'index.html';
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAdmin()) return;
  
  setTimeout(async () => {
    document.getElementById('loginOverlay').classList.add('hidden');
    await loadAllData();
  }, 1500);
});
