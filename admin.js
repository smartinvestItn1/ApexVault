// ========== APEXVAULT ADMIN JAVASCRIPT (HARDENED) ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, push, onValue } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);
// ========== CONFIG ==========
const ADMIN_PASSWORD = 'Promise1234@@$$'; // CHANGE THIS!
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
const MAX_LOGIN_ATTEMPTS = 3;

// ========== GLOBAL STATE ==========
let allUsers = {};
let allDeposits = {};
let allWithdrawals = {};
let allTransactions = [];
let platformSettings = {};
let currentAdmin = null;
let sessionTimer = null;
let lastActivity = Date.now();
// ========== ACTIVITY TRACKER ==========
function resetSessionTimer() {
  lastActivity = Date.now();
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    alert('⏰ Session expired due to inactivity. Logging out...');
    logout();
  }, SESSION_TIMEOUT);
}

// Track activity
['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
  document.addEventListener(event, resetSessionTimer);
});
 // ========== CHECK ADMIN LOGIN ==========

           // ========== CHECK ADMIN LOGIN (FIXED) ==========
async function checkAdmin() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe(); // Stop listening immediately
      
      // DEBUG: Show what we got
      if (!firebaseUser) {
        alert('❌ Not logged in via Firebase Auth. Redirecting to login...');
        window.location.href = 'login.html';
        resolve(false);
        return;
      }
      
      alert('✅ Firebase user found: ' + firebaseUser.email);
      
      const userId = firebaseUser.uid;
      alert('📍 UID: ' + userId);

      // Layer 1: Check admin role in database
      const userSnap = await get(ref(db, 'users/' + userId));
      const userData = userSnap.val();
      
      alert('📊 userData: ' + JSON.stringify(userData));

      if (!userData) {
        alert('❌ No user profile found in database for UID: ' + userId);
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      if (userData.role !== 'admin') {
        alert('🚫 Access denied. Your role is: ' + userData.role);
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      alert('✅ Admin role confirmed!');

      currentAdmin = {
        uid: userId,
        email: userData.email,
        fullName: userData.fullName
      };

      // Layer 2: Password check with attempt limiting
      const attemptsSnap = await get(ref(db, 'adminSecurity/loginAttempts/' + userId));
      const attemptsData = attemptsSnap.val();
      const attempts = (attemptsData && attemptsData.count) ? attemptsData.count : 0;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        alert('🚫 Account locked due to too many failed attempts.');
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      const password = prompt('🔐 Enter admin password:');

      if (password !== ADMIN_PASSWORD) {
        await update(ref(db, 'adminSecurity/loginAttempts/' + userId), { count: (attempts + 1) });

        await push(ref(db, 'adminAudit/loginAttempts'), {
          adminId: userId,
          adminEmail: userData.email,
          adminName: userData.fullName,
          success: false,
          timestamp: Date.now(),
          date: new Date().toISOString()
        });

        alert('🚫 Incorrect password. Attempt ' + (attempts + 1) + ' of ' + MAX_LOGIN_ATTEMPTS);

        if ((attempts + 1) >= MAX_LOGIN_ATTEMPTS) {
          alert('🔒 Account locked. Contact super admin to unlock.');
        }

        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      // Success — reset attempts
      await set(ref(db, 'adminSecurity/loginAttempts/' + userId), { count: 0 });

      await push(ref(db, 'adminAudit/logins'), {
        adminId: userId,
        adminEmail: userData.email,
        adminName: userData.fullName,
        success: true,
        timestamp: Date.now(),
        date: new Date().toISOString()
      });

      alert('✅ Admin login successful!');
      resetSessionTimer();
      resolve(true);
    });
  });
    }                                  }                     
// ========== AUDIT LOG ==========
async function logAdminAction(action, details) {
  await push(ref(db, 'adminAudit/actions'), {
    adminId: currentAdmin?.uid,
    adminEmail: currentAdmin?.email,
    adminName: currentAdmin?.fullName,
    action: action,
    details: details,
    timestamp: Date.now(),
    date: new Date().toISOString()
  });
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

    // Audit log
    await logAdminAction('toggle_feature', { feature, enabled });

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
  if (event && event.target) {
    event.target.closest('.nav-item').classList.add('active');
  }

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
    <th>User</th><th>Amount</th><th>Network</th><th>Date</th><th>Status</th><th>Actions</th>
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
      <td>${d.network ? d.network.replace('_', ' ') : (d.method || 'N/A')}</td>
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

    // Add to history
    await push(ref(db, 'users/' + deposit.userId + '/history'), {
      type: 'deposit',
      amount: deposit.amount,
      network: deposit.network || deposit.method,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    // Audit log
    await logAdminAction('approve_deposit', { depositId, amount: deposit.amount, userId: deposit.userId });

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

    // Audit log
    await logAdminAction('reject_deposit', { depositId, amount: allDeposits[depositId].amount, userId: allDeposits[depositId].userId });

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
    <th>User</th><th>Amount</th><th>Network</th><th>Wallet</th><th>Date</th><th>Status</th><th>Actions</th>
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
      <td>${w.network ? w.network.replace('_', ' ') : (w.method || 'N/A')}</td>
      <td><small style="color: var(--text-muted); font-family: monospace;">${w.walletAddress ? w.walletAddress.substring(0, 12) + '...' : 'N/A'}</small></td>
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

    // Add to history
    await push(ref(db, 'users/' + withdrawal.userId + '/history'), {
      type: 'withdraw',
      amount: withdrawal.amount,
      fee: withdrawal.fee || 0,
      total: withdrawal.total || withdrawal.amount,
      network: withdrawal.network || withdrawal.method,
      walletAddress: withdrawal.walletAddress,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    // Audit log
    await logAdminAction('approve_withdrawal', { withdrawalId, amount: withdrawal.amount, userId: withdrawal.userId, walletAddress: withdrawal.walletAddress });

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
      balance: (user.balance || 0) + (withdrawal.total || withdrawal.amount)
    });

    // Update status
    await update(ref(db, 'pendingWithdrawals/' + withdrawalId), { status: 'rejected' });
    await update(ref(db, 'users/' + withdrawal.userId + '/pendingWithdrawals/' + withdrawalId), { status: 'rejected' });

    // Add to history
    await push(ref(db, 'users/' + withdrawal.userId + '/history'), {
      type: 'withdraw',
      amount: withdrawal.amount,
      status: 'rejected',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    // Audit log
    await logAdminAction('reject_withdrawal', { withdrawalId, amount: withdrawal.amount, userId: withdrawal.userId, refunded: (withdrawal.total || withdrawal.amount) });

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

  alert(`User: ${user.fullName || 'N/A'}\nEmail: ${user.email || 'N/A'}\nPhone: ${user.phone || 'N/A'}\nBalance: $${(user.balance || 0).toLocaleString()}\nInvested: $${(user.totalInvested || 0).toLocaleString()}\nProfit: $${(user.totalProfit || 0).toLocaleString()}\nReferral Earnings: $${(user.referralEarnings || 0).toLocaleString()}`);
};
// ========== RENDER TRANSACTIONS ==========
function renderTransactions() {
  const container = document.getElementById('transactionsTable');
  allTransactions = [];

  for (const [userId, user] of Object.entries(allUsers)) {
    if (user.history) {
      for (const [txId, tx] of Object.entries(user.history)) {
        allTransactions.push({ ...tx, userId, userName: user.fullName, txId });
      }
    }
    if (user.transactions) {
      for (const [txId, tx] of Object.entries(user.transactions)) {
        if (!allTransactions.find(t => t.txId === txId)) {
          allTransactions.push({ ...tx, userId, userName: user.fullName, txId });
        }
      }
    }
  }

  allTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (allTransactions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No transactions found</p></div>';
    return;
  }

  let html = `<table class="data-table"><thead><tr>
    <th>User</th><th>Type</th><th>Amount</th><th>Details</th><th>Date</th><th>Status</th>
  </tr></thead><tbody>`;

  for (const tx of allTransactions) {
    const typeColors = {
      deposit: 'var(--success)',
      withdraw: 'var(--danger)',
      invest: 'var(--info)',
      invest_return: 'var(--success)',
      transfer_out: 'var(--danger)',
      transfer_in: 'var(--success)'
    };
    const typeLabels = {
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      invest: 'Invest',
      invest_return: 'Invest Return',
      transfer_out: 'Transfer Out',
      transfer_in: 'Transfer In'
    };
    const color = typeColors[tx.type] || 'var(--text-light)';
    const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' || tx.type === 'invest' ? '-' : '+';

    let details = '';
    if (tx.network) details = tx.network.replace('_', ' ');
    if (tx.walletAddress) details = tx.walletAddress.substring(0, 16) + '...';
    if (tx.to) details = 'To: ' + tx.to;
    if (tx.from) details = 'From: ' + tx.from;
    if (tx.plan) details = tx.plan + ' Plan';

    html += `<tr data-type="${tx.type}">
      <td><div class="user-cell"><div class="user-avatar">${(tx.userName || 'U').charAt(0)}</div><div>${tx.userName || 'Unknown'}</div></div></td>
      <td style="color: ${color};">${typeLabels[tx.type] || tx.type}</td>
      <td style="color: ${color}; font-weight: 600;">${sign}$${tx.amount.toLocaleString()}</td>
      <td><small style="color: var(--text-muted);">${details}</small></td>
      <td>${new Date(tx.date).toLocaleDateString()}</td>
      <td><span class="badge ${tx.status === 'pending' ? 'badge-pending' : tx.status === 'rejected' ? 'badge-rejected' : 'badge-approved'}">${tx.status.toUpperCase()}</span></td>
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
  if (sessionTimer) clearTimeout(sessionTimer);

  // Log logout
  if (currentAdmin) {
    push(ref(db, 'adminAudit/logins'), {
      adminId: currentAdmin.uid,
      adminEmail: currentAdmin.email,
      adminName: currentAdmin.fullName,
      action: 'logout',
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
  }

  sessionStorage.removeItem('apexvault_user');
  window.location.href = 'index.html';
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  setTimeout(async () => {
    document.getElementById('loginOverlay').classList.add('hidden');
    await loadAllData();
  }, 1500);
});

                       
