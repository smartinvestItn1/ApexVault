import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
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
const db = getDatabase(app);

const SESSION_TIMEOUT = 30 * 60 * 1000;

let allUsers = {};
let allDeposits = {};
let allWithdrawals = {};
let allTransactions = [];
let allInvestments = [];
let allKYC = {};
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

// ========== CHECK ADMIN ==========
async function checkAdmin() {
  try {
    const userJson = sessionStorage.getItem('apexvault_user');
    if (!userJson) {
      window.location.href = 'login.html';
      return false;
    }

    const user = JSON.parse(userJson);
    if (!user || !user.uid) {
      window.location.href = 'login.html';
      return false;
    }

    const userId = user.uid;
    const userSnap = await get(ref(db, 'users/' + userId));
    const userData = userSnap.val();

    if (!userData) {
      alert('Profile not found');
      window.location.href = 'dashboard.html';
      return false;
    }

    if (userData.role !== 'admin') {
      alert('Access denied. Not admin.');
      window.location.href = 'dashboard.html';
      return false;
    }

    currentAdmin = {
      uid: userId,
      email: userData.email,
      fullName: userData.fullName
    };

    resetSessionTimer();
    return true;
  } catch (err) {
    console.error('Admin check error:', err);
    alert('Error loading admin panel. Please login again.');
    window.location.href = 'login.html';
    return false;
  }
}

async function logAdminAction(action, details) {
  try {
    await push(ref(db, 'adminAudit/actions'), {
      adminId: currentAdmin?.uid,
      adminEmail: currentAdmin?.email,
      adminName: currentAdmin?.fullName,
      action: action,
      details: details,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

// ========== LOAD ALL DATA ==========
async function loadAllData() {
  console.log('Loading data...');

  try {
    const usersSnap = await get(ref(db, 'users'));
    allUsers = usersSnap.val() || {};
    console.log('Users loaded:', Object.keys(allUsers).length);
  } catch (err) {
    console.error('Error loading users:', err);
    allUsers = {};
  }

  try {
    const settingsSnap = await get(ref(db, 'platformSettings'));
    platformSettings = settingsSnap.val() || { transferEnabled: true, investEnabled: true, withdrawEnabled: true };
  } catch (err) {
    console.error('Error loading settings:', err);
    platformSettings = { transferEnabled: true, investEnabled: true, withdrawEnabled: true };
  }

  try {
    const depositsSnap = await get(ref(db, 'pendingDeposits'));
    allDeposits = depositsSnap.val() || {};
  } catch (err) {
    console.error('Error loading deposits:', err);
    allDeposits = {};
  }

  try {
    const withdrawalsSnap = await get(ref(db, 'pendingWithdrawals'));
    allWithdrawals = withdrawalsSnap.val() || {};
  } catch (err) {
    console.error('Error loading withdrawals:', err);
    allWithdrawals = {};
  }

  try {
    const kycSnap = await get(ref(db, 'pendingKYC'));
    allKYC = kycSnap.val() || {};
  } catch (err) {
    console.error('Error loading KYC:', err);
    allKYC = {};
  }

  updateStats();
  updateToggles();
  updateSidebarBadges();
  renderDeposits();
  renderWithdrawals();
  renderUsers();
  renderTransactions();
  renderInvestments();
  renderKYC();
  loadWalletAddresses();
  console.log('All data loaded');
}

// ========== UPDATE STATS ==========
function updateStats() {
  const userCount = Object.keys(allUsers).length;
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalInvested = 0;
  let totalReferral = 0;
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  let activeInvestments = 0;
  let pendingKYC = 0;

  for (const user of Object.values(allUsers)) {
    if (user.history) {
      for (const tx of Object.values(user.history)) {
        if (tx.status === 'completed' || tx.status === 'approved') {
          if (tx.type === 'deposit') totalDeposited += tx.amount || 0;
          if (tx.type === 'withdraw') totalWithdrawn += tx.amount || 0;
          if (tx.type === 'invest') totalInvested += tx.amount || 0;
          if (tx.type === 'referral_bonus') totalReferral += tx.amount || 0;
        }
      }
    }
    if (user.referralEarnings) totalReferral += user.referralEarnings;
    if (user.investments) {
      for (const inv of Object.values(user.investments)) {
        if (inv.status === 'active') activeInvestments++;
      }
    }
  }

  for (const d of Object.values(allDeposits)) {
    if (d.status === 'pending') pendingDeposits++;
    if (d.status === 'approved') totalDeposited += d.amount || 0;
  }

  for (const w of Object.values(allWithdrawals)) {
    if (w.status === 'pending') pendingWithdrawals++;
    if (w.status === 'approved') totalWithdrawn += w.amount || 0;
  }

  for (const k of Object.values(allKYC)) {
    if (k.status === 'pending') pendingKYC++;
  }

  let blockedCount = 0;
  if (!platformSettings.transferEnabled) blockedCount++;
  if (!platformSettings.investEnabled) blockedCount++;
  if (!platformSettings.withdrawEnabled) blockedCount++;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('totalUsers', userCount.toLocaleString());
  setText('totalDeposited', '$' + totalDeposited.toLocaleString());
  setText('totalWithdrawn', '$' + totalWithdrawn.toLocaleString());
  setText('totalInvested', '$' + totalInvested.toLocaleString());
  setText('statPendingDeposits', pendingDeposits);
  setText('statPendingWithdrawals', pendingWithdrawals);
  setText('statActiveInvestments', activeInvestments);
  setText('statReferralEarnings', '$' + totalReferral.toLocaleString());
  setText('quickPendingDeposits', pendingDeposits + ' requests');
  setText('quickPendingWithdrawals', pendingWithdrawals + ' requests');
  setText('quickActiveInvestments', activeInvestments + ' running');
  setText('blockedFeatures', blockedCount + ' disabled');
}

// ========== SIDEBAR BADGES ==========
function updateSidebarBadges() {
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  let activeInvestments = 0;
  let pendingKYC = 0;

  for (const d of Object.values(allDeposits)) {
    if (d.status === 'pending') pendingDeposits++;
  }
  for (const w of Object.values(allWithdrawals)) {
    if (w.status === 'pending') pendingWithdrawals++;
  }
  for (const user of Object.values(allUsers)) {
    if (user.investments) {
      for (const inv of Object.values(user.investments)) {
        if (inv.status === 'active') activeInvestments++;
      }
    }
  }
  for (const k of Object.values(allKYC)) {
    if (k.status === 'pending') pendingKYC++;
  }

  const updateBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'block' : 'none';
    }
  };

  updateBadge('sidebarBadgeDeposits', pendingDeposits);
  updateBadge('sidebarBadgeWithdrawals', pendingWithdrawals);
  updateBadge('sidebarBadgeInvestments', activeInvestments);
  updateBadge('sidebarBadgeKYC', pendingKYC);
}

// ========== TOGGLES ==========
function updateToggles() {
  const transferEl = document.getElementById('transferToggle');
  const investEl = document.getElementById('investToggle');
  const withdrawEl = document.getElementById('withdrawToggle');

  if (transferEl) transferEl.checked = platformSettings.transferEnabled !== false;
  if (investEl) investEl.checked = platformSettings.investEnabled !== false;
  if (withdrawEl) withdrawEl.checked = platformSettings.withdrawEnabled !== false;
}

window.toggleFeature = async function(feature) {
  const checkbox = document.getElementById(feature + 'Toggle');
  if (!checkbox) return;
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

// ========== SECTION NAVIGATION ==========
window.showSection = function(sectionName) {
  document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
  const section = document.getElementById(sectionName + 'Section');
  if (section) section.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (event && event.target) {
    const navItem = event.target.closest('.nav-item');
    if (navItem) navItem.classList.add('active');
  }

  const titles = {
    overview: 'Admin Dashboard',
    pendingDeposits: 'Pending Deposits',
    pendingWithdrawals: 'Pending Withdrawals',
    activeInvestments: 'Active Investments',
    users: 'All Users',
    transactions: 'All Transactions',
    walletSettings: 'Wallet Settings',
    addBonus: 'Add Bonus',
    kycReview: 'KYC Review',
    settings: 'Feature Controls'
  };

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = titles[sectionName] || 'Admin';

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
};

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
};

// ========== DEPOSITS ==========
function renderDeposits() {
  const container = document.getElementById('depositsTable');
  if (!container) return;
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
    html += '<td style="color:var(--success);font-weight:600;">+$' + (d.amount || 0).toLocaleString() + '</td>';
    html += '<td>' + (d.network ? d.network.replace('_', ' ') : (d.method || 'N/A')) + '</td>';
    html += '<td>' + new Date(d.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + d.status.toUpperCase() + '</span></td>';
    html += '<td>' + actions + '</td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterDeposits = function() {
  const search = document.getElementById('depositSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('depositFilter')?.value || 'all';
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
      balance: (user.balance || 0) + (deposit.amount || 0)
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
    updateSidebarBadges();
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
    updateSidebarBadges();
    renderDeposits();
    alert('Deposit rejected!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ========== WITHDRAWALS ==========
function renderWithdrawals() {
  const container = document.getElementById('withdrawalsTable');
  if (!container) return;
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
    html += '<td style="color:var(--danger);font-weight:600;">-$' + (w.amount || 0).toLocaleString() + '</td>';
    html += '<td>' + (w.network ? w.network.replace('_', ' ') : (w.method || 'N/A')) + '</td>';
    html += '<td style="max-width:180px; word-break:break-all;"><small style="font-family:monospace; line-height:1.4; display:block; margin-bottom:4px;">' + (w.walletAddress || 'N/A') + '</small><button class="btn-copy" onclick="navigator.clipboard.writeText(\'' + (w.walletAddress || '') + '\'); alert(\'Address copied!\')">Copy</button></td>';
    html += '<td>' + new Date(w.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + w.status.toUpperCase() + '</span></td>';
    html += '<td>' + actions + '</td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterWithdrawals = function() {
  const search = document.getElementById('withdrawSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('withdrawFilter')?.value || 'all';
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

    const userSnap = await get(ref(db, 'users/' + withdrawal.userId));
    const user = userSnap.val() || {};
    if ((user.balance || 0) < (withdrawal.total || withdrawal.amount || 0)) {
      alert('User has insufficient balance! Cannot approve.');
      return;
    }

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
    updateSidebarBadges();
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
      balance: (user.balance || 0) + (withdrawal.total || withdrawal.amount || 0)
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
    updateSidebarBadges();
    renderWithdrawals();
    alert('Withdrawal rejected! Money refunded.');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ========== ACTIVE INVESTMENTS ==========
function renderInvestments() {
  const container = document.getElementById('investmentsTable');
  if (!container) return;
  allInvestments = [];

  for (const [userId, user] of Object.entries(allUsers)) {
    if (user.investments) {
      for (const [invId, inv] of Object.entries(user.investments)) {
        if (inv.status === 'active') {
          allInvestments.push({ ...inv, userId, invId, userName: user.fullName, userEmail: user.email });
        }
      }
    }
  }

  if (allInvestments.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📈</div><p>No active investments found</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Plan</th><th>Amount</th><th>Profit</th><th>Duration</th><th>Time Left</th><th>Status</th></tr></thead><tbody>';

  const planNames = { startup: 'Startup', pro: 'Pro', ultimate: 'Ultimate' };

  for (const inv of allInvestments) {
    const created = new Date(inv.createdAt);
    const durationMs = (inv.durationHours || 24) * 60 * 60 * 1000;
    const endDate = new Date(created.getTime() + durationMs);
    const now = new Date();
    const diff = endDate - now;
    let timeText = 'Completed';
    if (diff > 0) {
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeText = totalHours + 'h ' + mins + 'm';
    }

    html += '<tr data-plan="' + inv.plan + '">';
    html += '<td><div class="user-cell"><div class="user-avatar">' + (inv.userName || 'U').charAt(0) + '</div><div>' + (inv.userName || 'Unknown') + '<br><small>' + (inv.userEmail || '') + '</small></div></div></td>';
    html += '<td><span class="badge badge-active">' + (planNames[inv.plan] || inv.plan) + '</span></td>';
    html += '<td style="font-weight:600;">$' + (inv.amount || 0).toLocaleString() + '</td>';
    html += '<td style="color:var(--success);font-weight:600;">+' + (inv.profitPercent || 0) + '% ($' + (inv.expectedProfit || 0).toLocaleString() + ')</td>';
    html += '<td>' + (inv.durationHours || 24) + ' hours</td>';
    html += '<td style="color:var(--accent);">' + timeText + '</td>';
    html += '<td><span class="badge badge-active">ACTIVE</span></td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterInvestments = function() {
  const search = document.getElementById('investSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('investFilter')?.value || 'all';
  document.querySelectorAll('#investmentsTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const plan = row.getAttribute('data-plan') || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || plan === filter;
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== USERS ==========
function renderUsers() {
  const container = document.getElementById('usersTable');
  if (!container) return;
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
    html += '<td><button class="btn-action btn-view" onclick="viewUser(\'' + id + '\')">View</button><button class="btn-action btn-approve" style="margin-left:5px;" onclick="manageUserFeatures(\'' + id + '\')">Manage</button></td>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterUsers = function() {
  const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('userFilter')?.value || 'all';
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

window.manageUserFeatures = async function(userId) {
  const u = allUsers[userId];
  if (!u) return;

  try {
    const featuresSnap = await get(ref(db, 'users/' + userId + '/features'));
    const features = featuresSnap.val() || {};

    const investEnabled = features.investEnabled !== false;
    const depositEnabled = features.depositEnabled !== false;
    const withdrawEnabled = features.withdrawEnabled !== false;

    const choice = prompt(
      'User: ' + (u.fullName || 'N/A') + '\n\n' +
      '1. Invest: ' + (investEnabled ? 'ENABLED' : 'BLOCKED') + '\n' +
      '2. Deposit: ' + (depositEnabled ? 'ENABLED' : 'BLOCKED') + '\n' +
      '3. Withdraw: ' + (withdrawEnabled ? 'ENABLED' : 'BLOCKED') + '\n\n' +
      'Enter number to toggle, or Cancel to exit:'
    );

    if (!choice) return;

    const num = parseInt(choice);
    let featureKey, featureName;

    if (num === 1) { featureKey = 'investEnabled'; featureName = 'Invest'; }
    else if (num === 2) { featureKey = 'depositEnabled'; featureName = 'Deposit'; }
    else if (num === 3) { featureKey = 'withdrawEnabled'; featureName = 'Withdraw'; }
    else { alert('Invalid choice'); return; }

    const currentValue = (num === 1 ? investEnabled : num === 2 ? depositEnabled : withdrawEnabled);
    const newValue = !currentValue;

    await update(ref(db, 'users/' + userId + '/features'), { [featureKey]: newValue });
    await logAdminAction('toggle_user_feature', { userId, feature: featureName, enabled: newValue });
    alert(featureName + ' is now ' + (newValue ? 'ENABLED' : 'BLOCKED') + ' for this user.');
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// ========== TRANSACTIONS ==========
function renderTransactions() {
  const container = document.getElementById('transactionsTable');
  if (!container) return;
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
    const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in' || tx.type === 'invest_return';
    let details = '';
    if (tx.network) details = tx.network.replace('_', ' ');
    if (tx.walletAddress) details = tx.walletAddress.substring(0, 16) + '...';
    if (tx.to) details = 'To: ' + tx.to;
    if (tx.from) details = 'From: ' + tx.from;
    if (tx.plan) details = tx.plan + ' Plan';

    html += '<tr data-type="' + tx.type + '">';
    html += '<td><div class="user-cell"><div class="user-avatar">' + (tx.userName || 'U').charAt(0) + '</div><div>' + (tx.userName || 'Unknown') + '</div></div></td>';
    html += '<td style="color:' + color + ';">' + (typeLabels[tx.type] || tx.type) + '</td>';
    html += '<td style="color:' + color + ';font-weight:600;">' + sign + '$' + (tx.amount || 0).toLocaleString() + '</td>';
    html += '<td><small style="color:var(--text-muted);">' + details + '</small></td>';
    html += '<td>' + new Date(tx.date).toLocaleDateString() + '</td>';
    html += '<td><span class="badge ' + (tx.status === 'pending' ? 'badge-pending' : tx.status === 'rejected' ? 'badge-rejected' : 'badge-approved') + '">' + tx.status.toUpperCase() + '</span></td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterTransactions = function() {
  const search = document.getElementById('txSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('txFilter')?.value || 'all';
  document.querySelectorAll('#transactionsTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const type = row.getAttribute('data-type') || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || type === filter || (filter === 'transfer' && (type === 'transfer_in' || type === 'transfer_out'));
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

// ========== KYC REVIEW ==========
function renderKYC() {
  const container = document.getElementById('kycTable');
  if (!container) return;
  const kycEntries = Object.entries(allKYC);

  if (kycEntries.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🛡️</div><p>No KYC submissions found</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Full Name</th><th>ID Number</th><th>DOB</th><th>Phone</th><th>Address</th><th>Documents</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  for (const [userId, k] of kycEntries) {
    const statusClass = k.status === 'pending' ? 'badge-pending' : k.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = k.status === 'pending'
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveKYC(\'' + userId + '\')">Approve</button><button class="btn-action btn-reject" onclick="rejectKYC(\'' + userId + '\')">Reject</button></div>'
      : 'Completed';

    const docs = '<div style="display:flex; gap:8px; flex-wrap:wrap;"><a href="' + (k.idFront || '#') + '" target="_blank" style="position:relative; display:inline-block;"><img src="' + (k.idFront || '') + '" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--border);" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';"><span style="display:none; font-size:0.7rem; color:var(--accent);">ID Front</span></a><a href="' + (k.selfie || '#') + '" target="_blank" style="position:relative; display:inline-block;"><img src="' + (k.selfie || '') + '" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--border);" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';"><span style="display:none; font-size:0.7rem; color:var(--accent);">Selfie</span></a></div>';

    html += '<tr data-status="' + k.status + '">';
    html += '<td><div class="user-cell"><div class="user-avatar">' + (k.userName || 'U').charAt(0) + '</div><div>' + (k.userName || 'Unknown') + '<br><small>' + (k.userEmail || '') + '</small></div></div></td>';
    html += '<td>' + (k.fullName || 'N/A') + '</td>';
    html += '<td style="font-family:monospace; font-size:0.8rem;">' + (k.idNumber || 'N/A') + '</td>';
    html += '<td>' + (k.dob || 'N/A') + '</td>';
    html += '<td>' + (k.phone || 'N/A') + '</td>';
    html += '<td style="max-width:150px; word-break:break-word;"><small>' + (k.address || 'N/A') + '</small></td>';
    html += '<td>' + docs + '</td>';
    html += '<td><span class="badge ' + statusClass + '">' + k.status.toUpperCase() + '</span></td>';
    html += '<td>' + actions + '</td></tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

window.filterKYC = function() {
  const search = document.getElementById('kycSearch')?.value.toLowerCase() || '';
  const filter = document.getElementById('kycFilter')?.value || 'all';
  document.querySelectorAll('#kycTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const status = row.getAttribute('data-status') || '';
    const matchSearch = text.includes(search);
    const matchFilter = filter === 'all' || status === filter;
    row.style.display = matchSearch && matchFilter ? '' : 'none';
  });
};

window.approveKYC = async function(userId) {
  if (!confirm('Approve this KYC submission?')) return;
  try {
    await update(ref(db, 'users/' + userId + '/kyc'), { status: 'approved', reviewedAt: new Date().toISOString() });
    await update(ref(db, 'pendingKYC/' + userId), { status: 'approved', reviewedAt: new Date().toISOString() });
    await logAdminAction('approve_kyc', { userId });
    if (allKYC[userId]) allKYC[userId].status = 'approved';
    updateStats();
    updateSidebarBadges();
    renderKYC();
    alert('KYC approved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

window.rejectKYC = async function(userId) {
  const reason = prompt('Enter rejection reason (optional):');
  if (reason === null) return;
  try {
    await update(ref(db, 'users/' + userId + '/kyc'), { status: 'rejected', rejectionReason: reason || 'No reason provided', reviewedAt: new Date().toISOString() });
    await update(ref(db, 'pendingKYC/' + userId), { status: 'rejected', rejectionReason: reason || 'No reason provided', reviewedAt: new Date().toISOString() });
    await logAdminAction('reject_kyc', { userId, reason });
    if (allKYC[userId]) {
      allKYC[userId].status = 'rejected';
      allKYC[userId].rejectionReason = reason || 'No reason provided';
    }
    updateStats();
    updateSidebarBadges();
    renderKYC();
    alert('KYC rejected!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ========== WALLET SETTINGS ==========
async function loadWalletAddresses() {
  try {
    const snapshot = await get(ref(db, 'platformSettings/depositAddresses'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const bep20El = document.getElementById('bep20Address');
      const trc20El = document.getElementById('trc20Address');
      const currentBep20 = document.getElementById('currentBep20');
      const currentTrc20 = document.getElementById('currentTrc20');

      if (data.USDT_BEP20 && bep20El) {
        bep20El.value = data.USDT_BEP20;
        if (currentBep20) {
          currentBep20.textContent = 'Current: ' + data.USDT_BEP20;
          currentBep20.classList.add('show');
        }
      }
      if (data.USDT_TRC20 && trc20El) {
        trc20El.value = data.USDT_TRC20;
        if (currentTrc20) {
          currentTrc20.textContent = 'Current: ' + data.USDT_TRC20;
          currentTrc20.classList.add('show');
        }
      }
    }
  } catch (err) {
    console.error('Error loading wallet addresses:', err);
  }
}

window.saveWalletAddresses = async function() {
  const bep20 = document.getElementById('bep20Address')?.value.trim() || '';
  const trc20 = document.getElementById('trc20Address')?.value.trim() || '';
  const saveBtn = document.getElementById('saveWalletBtn');
  const successMsg = document.getElementById('walletSuccessMsg');
  const errorMsg = document.getElementById('walletErrorMsg');

  if (!bep20 && !trc20) {
    alert('Please enter at least one wallet address');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }

  try {
    const updates = {};
    if (bep20) updates.USDT_BEP20 = bep20;
    if (trc20) updates.USDT_TRC20 = trc20;

    await set(ref(db, 'platformSettings/depositAddresses'), updates);

    const currentBep20 = document.getElementById('currentBep20');
    const currentTrc20 = document.getElementById('currentTrc20');
    if (bep20 && currentBep20) {
      currentBep20.textContent = 'Current: ' + bep20;
      currentBep20.classList.add('show');
    }
    if (trc20 && currentTrc20) {
      currentTrc20.textContent = 'Current: ' + trc20;
      currentTrc20.classList.add('show');
    }

    await logAdminAction('update_wallet_addresses', updates);
    if (successMsg) {
      successMsg.classList.add('show');
      setTimeout(() => successMsg.classList.remove('show'), 4000);
    }
  } catch (err) {
    console.error('Save error:', err);
    if (errorMsg) {
      errorMsg.classList.add('show');
      setTimeout(() => errorMsg.classList.remove('show'), 4000);
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  }
};

// ========== ADD BONUS ==========
window.sendBonus = async function() {
  const email = document.getElementById('bonusEmail')?.value.trim() || '';
  const amount = parseFloat(document.getElementById('bonusAmount')?.value || '0');
  const note = document.getElementById('bonusNote')?.value.trim() || '';
  const sendBtn = document.getElementById('sendBonusBtn');
  const successMsg = document.getElementById('bonusSuccessMsg');
  const errorMsg = document.getElementById('bonusErrorMsg');

  if (!email) { alert('Please enter user email'); return; }
  if (!amount || amount <= 0) { alert('Please enter a valid bonus amount'); return; }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  }

  try {
    let userId = null;
    let userData = null;
    for (const [id, u] of Object.entries(allUsers)) {
      if (u.email === email) {
        userId = id;
        userData = u;
        break;
      }
    }

    if (!userId) {
      alert('User not found with email: ' + email);
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Bonus';
      }
      return;
    }

    await update(ref(db, 'users/' + userId), {
      balance: (userData.balance || 0) + amount
    });

    await push(ref(db, 'users/' + userId + '/history'), {
      type: 'bonus',
      amount: amount,
      note: note || 'Admin bonus',
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await logAdminAction('send_bonus', { userId, email, amount, note });

    const emailEl = document.getElementById('bonusEmail');
    const amountEl = document.getElementById('bonusAmount');
    const noteEl = document.getElementById('bonusNote');
    if (emailEl) emailEl.value = '';
    if (amountEl) amountEl.value = '';
    if (noteEl) noteEl.value = '';

    if (successMsg) {
      successMsg.classList.add('show');
      setTimeout(() => successMsg.classList.remove('show'), 4000);
    }
    updateStats();
  } catch (err) {
    console.error('Bonus error:', err);
    if (errorMsg) {
      errorMsg.classList.add('show');
      setTimeout(() => errorMsg.classList.remove('show'), 4000);
    }
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Bonus';
    }
  }
};

// ========== LOGOUT ==========
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
    }).catch(() => {});
  }
  sessionStorage.removeItem('apexvault_user');
  window.location.href = 'index.html';
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Admin panel initializing...');
  const overlay = document.getElementById('loginOverlay');

  // FORCE REMOVE overlay after 5 seconds no matter what
  const forceRemoveTimeout = setTimeout(() => {
    console.log('Force removing loading overlay...');
    if (overlay) overlay.classList.add('hidden');
    if (!window._adminDataLoaded) {
      const main = document.getElementById('mainContent');
      if (main) {
        const toast = document.createElement('div');
        toast.innerHTML = '<div style="position:fixed; top:20px; right:20px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 20px; z-index:9998; box-shadow:0 10px 30px rgba(0,0,0,0.3);"><p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:8px;">Some data could not load.</p><button onclick="location.reload()" style="background:var(--accent); border:none; border-radius:8px; padding:8px 16px; color:var(--bg-deep); font-weight:700; font-size:0.8rem; cursor:pointer;">Reload</button></div>';
        document.body.appendChild(toast);
      }
    }
  }, 5000);

  try {
    const isAdmin = await Promise.race([
      checkAdmin(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Admin check timed out')), 8000))
    ]);

    if (!isAdmin) {
      clearTimeout(forceRemoveTimeout);
      return;
    }

    // Try to load data
    try {
      await Promise.race([
        loadAllData(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Data load timed out')), 10000))
      ]);
      window._adminDataLoaded = true;
    } catch (dataErr) {
      console.error('Data load error (non-fatal):', dataErr);
      window._adminDataLoaded = false;
    }

    clearTimeout(forceRemoveTimeout);
    if (overlay) overlay.classList.add('hidden');

  } catch (err) {
    clearTimeout(forceRemoveTimeout);
    console.error('Init error:', err);
    if (overlay) {
      overlay.innerHTML = '<div style="text-align:center; padding:20px;"><div style="font-size:1.8rem; font-weight:800; background:linear-gradient(90deg, var(--gradient-start), var(--gradient-end)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:16px;">ApexVault</div><p style="color:var(--danger); margin-bottom:8px; font-weight:600;">Unable to load admin panel</p><p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">' + (err.message || 'Please check your connection and try again') + '</p><div style="display:flex; gap:12px; justify-content:center;"><button onclick="location.reload()" style="background:var(--accent); border:none; border-radius:10px; padding:12px 24px; color:var(--bg-deep); font-weight:700; cursor:pointer;">Retry</button><a href="login.html" style="background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:12px 24px; color:var(--text-light); font-weight:600; text-decoration:none; display:inline-block;">Back to Login</a></div></div>';
    }
  }
});
