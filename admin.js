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

const SESSION_TIMEOUT = 30 * 60 * 1000;

let allUsers = {};
let allDeposits = {};
let allWithdrawals = {};
let allTransactions = [];
let allKYC = {};
let allInvestments = [];
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

// ========== CHECK ADMIN (NO PASSWORD PROMPT) ==========
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

// ========== LOAD ALL DATA ==========
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

  const kycSnap = await get(ref(db, 'pendingKYC'));
  allKYC = kycSnap.val() || {};

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

  // Calculate from all users' history for totals
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

    // Count active investments
    if (user.investments) {
      for (const inv of Object.values(user.investments)) {
        if (inv.status === 'active') activeInvestments++;
      }
    }
  }

  // Also check pending collections
  for (const d of Object.values(allDeposits)) {
    if (d.status === 'pending') pendingDeposits++;
    if (d.status === 'approved') totalDeposited += d.amount || 0;
  }

  for (const w of Object.values(allWithdrawals)) {
    if (w.status === 'pending') pendingWithdrawals++;
    if (w.status === 'approved') totalWithdrawn += w.amount || 0;
  }

  let pendingKYC = 0;
  for (const k of Object.values(allKYC)) {
    if (k.status === 'pending') pendingKYC++;
  }

  let blockedCount = 0;
  if (!platformSettings.transferEnabled) blockedCount++;
  if (!platformSettings.investEnabled) blockedCount++;
  if (!platformSettings.withdrawEnabled) blockedCount++;

  // Update main stat cards
  document.getElementById('totalUsers').textContent = userCount.toLocaleString();
  document.getElementById('totalDeposited').textContent = '$' + totalDeposited.toLocaleString();
  document.getElementById('totalWithdrawn').textContent = '$' + totalWithdrawn.toLocaleString();
  document.getElementById('totalInvested').textContent = '$' + totalInvested.toLocaleString();

  // Update secondary stat cards
  document.getElementById('statPendingDeposits').textContent = pendingDeposits;
  document.getElementById('statPendingWithdrawals').textContent = pendingWithdrawals;
  document.getElementById('statActiveInvestments').textContent = activeInvestments;
  document.getElementById('statReferralEarnings').textContent = '$' + totalReferral.toLocaleString();

  // Update quick action cards
  document.getElementById('quickPendingDeposits').textContent = pendingDeposits + ' requests';
  document.getElementById('quickPendingWithdrawals').textContent = pendingWithdrawals + ' requests';
  document.getElementById('quickActiveInvestments').textContent = activeInvestments + ' running';
  document.getElementById('blockedFeatures').textContent = blockedCount + ' disabled';
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

  const depBadge = document.getElementById('sidebarBadgeDeposits');
  const withBadge = document.getElementById('sidebarBadgeWithdrawals');
  const invBadge = document.getElementById('sidebarBadgeInvestments');
  const kycBadge = document.getElementById('sidebarBadgeKYC');

  if (depBadge) {
    depBadge.textContent = pendingDeposits;
    depBadge.style.display = pendingDeposits > 0 ? 'block' : 'none';
  }
  if (withBadge) {
    withBadge.textContent = pendingWithdrawals;
    withBadge.style.display = pendingWithdrawals > 0 ? 'block' : 'none';
  }
  if (invBadge) {
    invBadge.textContent = activeInvestments;
    invBadge.style.display = activeInvestments > 0 ? 'block' : 'none';
  }
  if (kycBadge) {
    kycBadge.textContent = pendingKYC;
    kycBadge.style.display = pendingKYC > 0 ? 'block' : 'none';
  }
}

// ========== TOGGLES ==========
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
    alert((enabled ? '✅ Enabled ' : '🚫 Blocked ') + feature);
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
    activeInvestments: 'Active Investments',
    users: 'All Users',
    transactions: 'All Transactions',
    walletSettings: 'Wallet Settings',
    addBonus: 'Add Bonus',
    kycReview: 'KYC Review',
    settings: 'Feature Controls'
  };
  document.getElementById('pageTitle').textContent = titles[sectionName] || 'Admin';
  document.getElementById('sidebar').classList.remove('open');
};

window.toggleMobileSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};

// ========== DEPOSITS ==========
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
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveDeposit('' + id + '')">Approve</button><button class="btn-action btn-reject" onclick="rejectDeposit('' + id + '')">Reject</button></div>'
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
    alert('✅ Deposit approved!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
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
    alert('❌ Deposit rejected!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== WITHDRAWALS ==========
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
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveWithdrawal('' + id + '')">Approve</button><button class="btn-action btn-reject" onclick="rejectWithdrawal('' + id + '')">Reject</button></div>'
      : 'Completed';

    html += '<tr><td><div class="user-cell"><div class="user-avatar">' + (w.userName || 'U').charAt(0) + '</div><div>' + (w.userName || 'Unknown') + '<br><small>' + (w.userEmail || '') + '</small></div></div></td>';
    html += '<td style="color:var(--danger);font-weight:600;">-$' + (w.amount || 0).toLocaleString() + '</td>';
    html += '<td>' + (w.network ? w.network.replace('_', ' ') : (w.method || 'N/A')) + '</td>';
    html += '<td style="max-width:180px; word-break:break-all;"><small style="font-family:monospace; line-height:1.4; display:block; margin-bottom:4px;">' + (w.walletAddress || 'N/A') + '</small><button class="btn-copy" onclick="navigator.clipboard.writeText('' + (w.walletAddress || '') + ''); alert('Address copied!')">📋 Copy</button></td>';
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

    const userSnap = await get(ref(db, 'users/' + withdrawal.userId));
    const user = userSnap.val() || {};
    if ((user.balance || 0) < (withdrawal.total || withdrawal.amount || 0)) {
      alert('❌ User has insufficient balance! Cannot approve.');
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
    alert('✅ Withdrawal approved!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
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
    alert('❌ Withdrawal rejected! Money refunded.');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== ACTIVE INVESTMENTS ==========
function renderInvestments() {
  const container = document.getElementById('investmentsTable');
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
  const search = document.getElementById('investSearch').value.toLowerCase();
  const filter = document.getElementById('investFilter').value;
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
    html += '<td><button class="btn-action btn-view" onclick="viewUser('' + id + '')">View</button><button class="btn-action btn-approve" style="margin-left:5px;" onclick="manageUserFeatures('' + id + '')">Manage</button></td>';
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

window.manageUserFeatures = async function(userId) {
  const u = allUsers[userId];
  if (!u) return;

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
};

// ========== TRANSACTIONS ==========
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
    html += '<td style="color:' + color + ';font-weight:600;">' + sign + '$' + (tx.amount || 0).toLocaleString() + '</td>';
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

// ========== WALLET SETTINGS ==========
async function loadWalletAddresses() {
  try {
    const snapshot = await get(ref(db, 'platformSettings/depositAddresses'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.USDT_BEP20) {
        document.getElementById('bep20Address').value = data.USDT_BEP20;
        document.getElementById('currentBep20').textContent = 'Current: ' + data.USDT_BEP20;
        document.getElementById('currentBep20').classList.add('show');
      }
      if (data.USDT_TRC20) {
        document.getElementById('trc20Address').value = data.USDT_TRC20;
        document.getElementById('currentTrc20').textContent = 'Current: ' + data.USDT_TRC20;
        document.getElementById('currentTrc20').classList.add('show');
      }
    }
  } catch (err) {
    console.error('Error loading wallet addresses:', err);
  }
}

window.saveWalletAddresses = async function() {
  const bep20 = document.getElementById('bep20Address').value.trim();
  const trc20 = document.getElementById('trc20Address').value.trim();
  const saveBtn = document.getElementById('saveWalletBtn');
  const successMsg = document.getElementById('walletSuccessMsg');
  const errorMsg = document.getElementById('walletErrorMsg');

  if (!bep20 && !trc20) {
    alert('Please enter at least one wallet address');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const updates = {};
    if (bep20) updates.USDT_BEP20 = bep20;
    if (trc20) updates.USDT_TRC20 = trc20;

    await set(ref(db, 'platformSettings/depositAddresses'), updates);

    if (bep20) {
      document.getElementById('currentBep20').textContent = 'Current: ' + bep20;
      document.getElementById('currentBep20').classList.add('show');
    }
    if (trc20) {
      document.getElementById('currentTrc20').textContent = 'Current: ' + trc20;
      document.getElementById('currentTrc20').classList.add('show');
    }

    await logAdminAction('update_wallet_addresses', updates);
    successMsg.classList.add('show');
    setTimeout(() => successMsg.classList.remove('show'), 4000);
  } catch (err) {
    console.error('Save error:', err);
    errorMsg.classList.add('show');
    setTimeout(() => errorMsg.classList.remove('show'), 4000);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
};

// ========== ADD BONUS ==========
window.sendBonus = async function() {
  const email = document.getElementById('bonusEmail').value.trim();
  const amount = parseFloat(document.getElementById('bonusAmount').value);
  const note = document.getElementById('bonusNote').value.trim();
  const sendBtn = document.getElementById('sendBonusBtn');
  const successMsg = document.getElementById('bonusSuccessMsg');
  const errorMsg = document.getElementById('bonusErrorMsg');

  if (!email) { alert('Please enter user email'); return; }
  if (!amount || amount <= 0) { alert('Please enter a valid bonus amount'); return; }

  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  try {
    // Find user by email
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
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Bonus';
      return;
    }

    // Add bonus to user balance
    await update(ref(db, 'users/' + userId), {
      balance: (userData.balance || 0) + amount
    });

    // Add to user history
    await push(ref(db, 'users/' + userId + '/history'), {
      type: 'bonus',
      amount: amount,
      note: note || 'Admin bonus',
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await logAdminAction('send_bonus', { userId, email, amount, note });

    // Clear form
    document.getElementById('bonusEmail').value = '';
    document.getElementById('bonusAmount').value = '';
    document.getElementById('bonusNote').value = '';

    successMsg.classList.add('show');
    setTimeout(() => successMsg.classList.remove('show'), 4000);
    updateStats();
  } catch (err) {
    console.error('Bonus error:', err);
    errorMsg.classList.add('show');
    setTimeout(() => errorMsg.classList.remove('show'), 4000);
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Bonus';
  }
};

// ========== KYC REVIEW ==========
function renderKYC() {
  const container = document.getElementById('kycTable');
  const kycEntries = Object.entries(allKYC);

  if (kycEntries.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🛡️</div><p>No KYC submissions found</p></div>';
    return;
  }

  let html = '<table class="data-table"><thead><tr><th>User</th><th>Full Name</th><th>ID Number</th><th>DOB</th><th>Phone</th><th>Address</th><th>Documents</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  for (const [userId, k] of kycEntries) {
    const statusClass = k.status === 'pending' ? 'badge-pending' : k.status === 'approved' ? 'badge-approved' : 'badge-rejected';
    const actions = k.status === 'pending'
      ? '<div class="action-btns"><button class="btn-action btn-approve" onclick="approveKYC('' + userId + '')">Approve</button><button class="btn-action btn-reject" onclick="rejectKYC('' + userId + '')">Reject</button></div>'
      : 'Completed';

    const docs = '<a href="' + (k.idFront || '#') + '" target="_blank" style="color:var(--accent); font-size:0.8rem; display:block; margin-bottom:4px;">📎 ID Front</a><a href="' + (k.selfie || '#') + '" target="_blank" style="color:var(--accent); font-size:0.8rem;">📎 Selfie</a>';

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
  const search = document.getElementById('kycSearch').value.toLowerCase();
  const filter = document.getElementById('kycFilter').value;
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
    allKYC[userId].status = 'approved';
    updateStats();
    updateSidebarBadges();
    renderKYC();
    alert('✅ KYC approved!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

window.rejectKYC = async function(userId) {
  const reason = prompt('Enter rejection reason (optional):');
  if (reason === null) return; // Cancelled
  try {
    await update(ref(db, 'users/' + userId + '/kyc'), { status: 'rejected', rejectionReason: reason || 'No reason provided', reviewedAt: new Date().toISOString() });
    await update(ref(db, 'pendingKYC/' + userId), { status: 'rejected', rejectionReason: reason || 'No reason provided', reviewedAt: new Date().toISOString() });
    await logAdminAction('reject_kyc', { userId, reason });
    allKYC[userId].status = 'rejected';
    allKYC[userId].rejectionReason = reason || 'No reason provided';
    updateStats();
    updateSidebarBadges();
    renderKYC();
    alert('❌ KYC rejected!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
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
