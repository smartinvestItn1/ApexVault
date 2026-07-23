import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, push } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
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
const ADMIN_PASSWORD = 'Promise1234@@$$';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 3;

let allUsers = {};
let allDeposits = {};
let allWithdrawals = {};
let allTransactions = [];
let platformSettings = {};
let currentAdmin = null;
let sessionTimer = null;
function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    alert('Session expired. Logging out...');
    logout();
  }, SESSION_TIMEOUT);
}

['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
  document.addEventListener(event, resetSessionTimer);
});
async function checkAdmin() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();

      if (!firebaseUser) {
        window.location.href = 'login.html';
        resolve(false);
        return;
      }

      const userId = firebaseUser.uid;
      const userSnap = await get(ref(db, 'users/' + userId));
      const userData = userSnap.val();

      if (!userData) {
        alert('Profile not found');
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      if (userData.role !== 'admin') {
        alert('Access denied. Not admin.');
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      currentAdmin = {
        uid: userId,
        email: userData.email,
        fullName: userData.fullName
      };

      const attemptsSnap = await get(ref(db, 'adminSecurity/loginAttempts/' + userId));
      const attemptsData = attemptsSnap.val();
      const attempts = (attemptsData && attemptsData.count) ? attemptsData.count : 0;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        alert('Account locked.');
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      const password = prompt('Enter admin password:');

      if (password !== ADMIN_PASSWORD) {
        await update(ref(db, 'adminSecurity/loginAttempts/' + userId), { count: (attempts + 1) });
        alert('Wrong password. Attempt ' + (attempts + 1));
        window.location.href = 'dashboard.html';
        resolve(false);
        return;
      }

      await set(ref(db, 'adminSecurity/loginAttempts/' + userId), { count: 0 });
      resetSessionTimer();
      resolve(true);
    });
  });
  }
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
  async function loadAllData() {
  const usersSnap = await get(ref(db, 'users'));
  allUsers = usersSnap.val() || {};

  const settingsSnap = await get(ref(db, 'platformSettings'));
  platformSettings = settingsSnap.val() || {
    transferEnabled: true,
    investEnabled: true,
    withdrawEnabled: true
  };

  const depositsSnap = await get(ref(db, 'pendingDeposits'));
  allDeposits = depositsSnap.val() || {};

  const withdrawalsSnap = await get(ref(db, 'pendingWithdrawals'));
  allWithdrawals = withdrawalsSnap.val() || {};

  updateStats();
  updateToggles();
  renderDeposits();
  renderWithdrawals();
  renderUsers();
  renderTransactions();
}
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

  let blockedCount = 0;
  if (!platformSettings.transferEnabled) blockedCount++;
  if (!platformSettings.investEnabled) blockedCount++;
  if (!platformSettings.withdrawEnabled) blockedCount++;

  document.getElementById('totalUsers').textContent = userCount;
  document.getElementById('totalDeposits').textContent = '$' + totalDeposits.toLocaleString();
  document.getElementById('totalWithdrawals').textContent = '$' + totalWithdrawals.toLocaleString();
  document.getElementById('totalPending').textContent = pendingDeposits + pendingWithdrawals;
  document.getElementById('quickPendingDeposits').textContent = pendingDeposits;
  document.getElementById('quickPendingWithdrawals').textContent = pendingWithdrawals;
  document.getElementById('blockedFeatures').textContent = blockedCount;
}
function updateToggles() {
  document.getElementById('transferToggle').checked = platformSettings.transferEnabled !== false;
  document.getElementById('investToggle').checked = platformSettings.investEnabled !== false;
  document.getElementById('withdrawToggle').checked = platformSettings.withdrawEnabled !== false;
}
window.toggleFeature = async function(feature) {
  const checkbox = document.getElementById(feature + 'Toggle');
  const enabled = checkbox.checked;

  try {
    await update(ref(db, 'platformSettings'), {
      [feature + 'Enabled']: enabled
    });
    platformSettings[feature + 'Enabled'] = enabled;
    updateStats();
    await logAdminAction('toggle_feature', { feature, enabled });
    alert((enabled ? 'Enabled ' : 'Blocked ') + feature);
  } catch (error) {
    alert('Error: ' + error.message);
    checkbox.checked = !enabled;
  }
};

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

window.toggleMobileSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};
function renderDeposits() {
  const container = document.getElementById('depositsTable');
  const deposits = Object.entries(allDeposits);

  if (deposits.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">💰</div><p>No deposit requests</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Amount</th><th>Network</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  for (const [id, d] of deposits) {
    const statusClass = d.status === 'pending' ? 'badge-pending' : d.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = d.status === 'pending'
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveDeposit(\'' + id + '\')">Approve</button><button class="btn-action btn-reject" onclick="rejectDeposit(\'' + id + '\')">Reject</button></div>'
      : 'Completed';

    html += '<tr><td><div class="user-cell"><div class="user-avatar">' + (d.userName || 'U').charAt(0) + '</div><div>' + (d.userName || 'Unknown') + '<br><small>' + (d.userEmail || '') + '</small></div></div></td>';
    html += '<td style="color:var(--success);font-weight:600;">+$' + d.amount.toLocaleString() + '</td>';
    html += '<td>' + (d.network ? d.network.replace('_', ' ') : (d.method || 'N/A')) + '</td>';
    html += '<td>' + new Date(d.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + d.status.toUpperCase() + '</span></td>';
    html += '<td>' + actions + '</td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterDeposits = function() {
  const search = document.getElementById('depositSearch').value.toLowerCase();
  const filter = document.getElementById('depositFilter').value;
  document.querySelectorAll('#depositsTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.querySelector('.badge')?.textContent.toLowerCase() || '';
    row.style.display = (text.includes(search) && (filter === 'all' || status === filter)) ? '' : 'none';
  });
};
window.approveDeposit = async function(depositId) {
  if (!confirm('Approve this deposit?')) return;
  try {
    const deposit = allDeposits[depositId];
    if (!deposit) return;

    await update(ref(db, 'pendingDeposits/' + depositId), { status: 'approved' });
    await update(ref(db, 'users/' + deposit.userId + '/pendingDeposits/' + depositId), { status: 'approved' });

    const userSnap = await get(ref(db, 'users/' + deposit.userId));
    const user = userSnap.val() || {};
    await update(ref(db, 'users/' + deposit.userId), {
      balance: (user.balance || 0) + deposit.amount
    });

    await push(ref(db, 'users/' + deposit.userId + '/history'), {
      type: 'deposit',
      amount: deposit.amount,
      network: deposit.network || deposit.method,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await logAdminAction('approve_deposit', { depositId, amount: deposit.amount, userId: deposit.userId });
    allDeposits[depositId].status = 'approved';
    updateStats();
    renderDeposits();
    alert('Deposit approved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.rejectDeposit = async function(depositId) {
  if (!confirm('Reject this deposit?')) return;
  try {
    await update(ref(db, 'pendingDeposits/' + depositId), { status: 'rejected' });
    await update(ref(db, 'users/' + allDeposits[depositId].userId + '/pendingDeposits/' + depositId), { status: 'rejected' });
    await logAdminAction('reject_deposit', { depositId, amount: allDeposits[depositId].amount, userId: allDeposits[depositId].userId });
    allDeposits[depositId].status = 'rejected';
    updateStats();
    renderDeposits();
    alert('Deposit rejected!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
 function renderWithdrawals() {
  const container = document.getElementById('withdrawalsTable');
  const withdrawals = Object.entries(allWithdrawals);

  if (withdrawals.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">💸</div><p>No withdrawal requests</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Amount</th><th>Network</th><th>Wallet</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  for (const [id, w] of withdrawals) {
    const statusClass = w.status === 'pending' ? 'badge-pending' : w.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = w.status === 'pending'
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveWithdrawal(\'' + id + '\')">Approve</button><button class="btn-action btn-reject" onclick="rejectWithdrawal(\'' + id + '\')">Reject</button></div>'
      : 'Completed';

    html += '<tr><td><div class="user-cell"><div class="user-avatar">' + (w.userName || 'U').charAt(0) + '</div><div>' + (w.userName || 'Unknown') + '<br><small>' + (w.userEmail || '') + '</small></div></div></td>';
    html += '<td style="color:var(--danger);font-weight:600;">-$' + w.amount.toLocaleString() + '</td>';
    html += '<td>' + (w.network ? w.network.replace('_', ' ') : (w.method || 'N/A')) + '</td>';
    html += '<td><small style="font-family:monospace;">' + (w.walletAddress ? w.walletAddress.substring(0, 12) + '...' : 'N/A') + '</small></td>';
    html += '<td>' + new Date(w.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + w.status.toUpperCase() + '</span></td>';
    html += '<td>' + actions + '</td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterWithdrawals = function() {
  const search = document.getElementById('withdrawSearch').value.toLowerCase();
  const filter = document.getElementById('withdrawFilter').value;
  document.querySelectorAll('#withdrawalsTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.querySelector('.badge')?.textContent.toLowerCase() || '';
    row.style.display = (text.includes(search) && (filter === 'all' || status === filter)) ? '' : 'none';
  });
};
  window.approveWithdrawal = async function(withdrawalId) {
  if (!confirm('Approve this withdrawal?')) return;
  try {
    const withdrawal = allWithdrawals[withdrawalId];
    if (!withdrawal) return;

    await update(ref(db, 'pendingWithdrawals/' + withdrawalId), { status: 'approved' });
    await update(ref(db, 'users/' + withdrawal.userId + '/pendingWithdrawals/' + withdrawalId), { status: 'approved' });

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

    await logAdminAction('approve_withdrawal', { withdrawalId, amount: withdrawal.amount, userId: withdrawal.userId });
    allWithdrawals[withdrawalId].status = 'approved';
    updateStats();
    renderWithdrawals();
    alert('Withdrawal approved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.rejectWithdrawal = async function(withdrawalId) {
  if (!confirm('Reject? Money will be refunded.')) return;
  try {
    const withdrawal = allWithdrawals[withdrawalId];
    const userSnap = await get(ref(db, 'users/' + withdrawal.userId));
    const user = userSnap.val() || {};
    await update(ref(db, 'users/' + withdrawal.userId), {
      balance: (user.balance || 0) + (withdrawal.total || withdrawal.amount)
    });

    await update(ref(db, 'pendingWithdrawals/' + withdrawalId), { status: 'rejected' });
    await update(ref(db, 'users/' + withdrawal.userId + '/pendingWithdrawals/' + withdrawalId), { status: 'rejected' });

    await push(ref(db, 'users/' + withdrawal.userId + '/history'), {
      type: 'withdraw',
      amount: withdrawal.amount,
      status: 'rejected',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await logAdminAction('reject_withdrawal', { withdrawalId, amount: withdrawal.amount, userId: withdrawal.userId });
    allWithdrawals[withdrawalId].status = 'rejected';
    updateStats();
    renderWithdrawals();
    alert('Withdrawal rejected! Money refunded.');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
 function renderUsers() {
  const container = document.getElementById('usersTable');
  const users = Object.entries(allUsers);

  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">👥</div><p>No users found</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Balance</th><th>Invested</th><th>Profit</th><th>Joined</th><th>Actions</th></tr></thead><tbody>';

  for (const [id, u] of users) {
    const hasInvestment = u.investments && Object.keys(u.investments).length > 0;
    html += '<tr data-has-investment="' + hasInvestment + '">';
    html += '<td><div class="user-cell"><div class="user-avatar">' + (u.fullName || 'U').charAt(0) + '</div><div>' + (u.fullName || 'Unknown') + '<br><small>' + (u.email || '') + '</small></div></div></td>';
    html += '<td>$' + (u.balance || 0).toLocaleString() + '</td>';
    html += '<td>$' + (u.totalInvested || 0).toLocaleString() + '</td>';
    html += '<td style="color:var(--success);">$' + (u.totalProfit || 0).toLocaleString() + '</td>';
    html += '<td>' + (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A') + '</td>';
    html += '<td><button class="btn-action btn-view" onclick="viewUser(\'' + id + '\')">View</button></td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterUsers = function() {
  const search = document.getElementById('userSearch').value.toLowerCase();
  const filter = document.getElementById('userFilter').value;
  document.querySelectorAll('#usersTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const hasInvestment = row.getAttribute('data-has-investment') === 'true';
    const matchSearch = text.includes(search);
    let matchFilter = true;
    if (filter === 'withInvestment') matchFilter = hasInvestment;
    if (filter === 'noInvestment') matchFilter = !hasInvestment;
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

window.viewUser = function(userId) {
  const u = allUsers[userId];
  if (!u) return;
  alert('User: ' + (u.fullName || 'N/A') + '\nEmail: ' + (u.email || 'N/A') + '\nPhone: ' + (u.phone || 'N/A') + '\nBalance: $' + (u.balance || 0).toLocaleString() + '\nInvested: $' + (u.totalInvested || 0).toLocaleString() + '\nProfit: $' + (u.totalProfit || 0).toLocaleString());
};
function renderTransactions() {
  const container = document.getElementById('transactionsTable');
  allTransactions = [];

  for (const [userId, user] of Object.entries(allUsers)) {
    if (user.history) {
      for (const [txId, tx] of Object.entries(user.history)) {
        allTransactions.push({ ...tx, userId, userName: user.fullName, txId });
      }
    }
  }

  allTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (allTransactions.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No transactions found</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Details</th><th>Date</th><th>Status</th></tr></thead><tbody>';

  const typeColors = { deposit: 'var(--success)', withdraw: 'var(--danger)', invest: 'var(--info)', invest_return: 'var(--success)', transfer_out: 'var(--danger)', transfer_in: 'var(--success)' };
  const typeLabels = { deposit: 'Deposit', withdraw: 'Withdraw', invest: 'Invest', invest_return: 'Invest Return', transfer_out: 'Transfer Out', transfer_in: 'Transfer In' };

  for (const tx of allTransactions) {
    const color = typeColors[tx.type] || 'var(--text-light)';
    const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' || tx.type === 'invest' ? '-' : '+';
    let details = '';
    if (tx.network) details = tx.network.replace('_', ' ');
    if (tx.walletAddress) details = tx.walletAddress.substring(0, 16) + '...';
    if (tx.to) details = 'To: ' + tx.to;
    if (tx.from) details = 'From: ' + tx.from;
    if (tx.plan) details = tx.plan + ' Plan';

    html += '<tr data-type="' + tx.type + '">';
    html += '<td><div class="user-cell"><div class="user-avatar">' + (tx.userName || 'U').charAt(0) + '</div><div>' + (tx.userName || 'Unknown') + '</div></div></td>';
    html += '<td style="color:' + color + ';">' + (typeLabels[tx.type] || tx.type) + '</td>';
    html += '<td style="color:' + color + ';font-weight:600;">' + sign + '$' + tx.amount.toLocaleString() + '</td>';
    html += '<td><small style="color:var(--text-muted);">' + details + '</small></td>';
    html += '<td>' + new Date(tx.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + (tx.status === 'pending' ? 'badge-pending' : tx.status === 'rejected' ? 'badge-rejected' : 'badge-approved') + '">' + tx.status.toUpperCase() + '</span></td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterTransactions = function() {
  const search = document.getElementById('txSearch').value.toLowerCase();
  const filter = document.getElementById('txFilter').value;
  document.querySelectorAll('#transactionsTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const type = row.getAttribute('data-type') || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || type === filter || (filter === 'transfer' && (type === 'transfer_in' || type === 'transfer_out'));
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};
 window.logout = function() {
  if (sessionTimer) clearTimeout(sessionTimer);
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

document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  setTimeout(async () => {
    document.getElementById('loginOverlay').classList.add('hidden');
    await loadAllData();
  }, 1500);
});
    
    
