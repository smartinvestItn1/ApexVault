// ========== APEXVAULT DASHBOARD JAVASCRIPT ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
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
const db = getDatabase(app);

// ========== GLOBAL STATE ==========
let currentUser = null;
let userData = null;
let currentPlan = null;
let currentPlanMin = 0;
let currentPlanMax = 0;
let currentPlanProfit = 0;

// ========== CHECK LOGIN ==========
function checkLogin() {
  const userJson = sessionStorage.getItem('apexvault_user');
  if (!userJson) {
    window.location.href = 'login.html';
    return false;
  }
  currentUser = JSON.parse(userJson);
  return true;
}

// ========== CHECK FEATURE BLOCKED ==========
async function isFeatureBlocked(feature) {
  const snapshot = await get(ref(db, 'platformSettings/' + feature + 'Enabled'));
  return snapshot.val() === false;
}

// ========== LOAD USER DATA ==========
async function loadUserData() {
  if (!currentUser) return;
  
  const snapshot = await get(ref(db, 'users/' + currentUser.id));
  userData = snapshot.val() || {};
  
  // Ensure user has balance field
  if (userData.balance === undefined) {
    await update(ref(db, 'users/' + currentUser.id), { balance: 0 });
    userData.balance = 0;
  }
  
  // Update sidebar
  document.getElementById('userName').textContent = userData.fullName || 'User';
  document.getElementById('userEmail').textContent = userData.email || '';
  document.getElementById('userAvatar').textContent = (userData.fullName || 'U').charAt(0).toUpperCase();
  
  // Update stats
  updateDashboardStats();
  
  // Load active investments
  loadActiveInvestments();
  
  // Load transactions
  loadTransactions();
  
  // Load pending
  loadPending();
  
  // Update referral link
  const refLink = 'https://apexvault.com/ref/' + currentUser.id;
  document.getElementById('referralLink').value = refLink;
  
  // Load referral stats
  loadReferralStats();
}

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats() {
  const balance = userData.balance || 0;
  const invested = userData.totalInvested || 0;
  const profit = userData.totalProfit || 0;
  const refEarned = userData.referralEarnings || 0;
  
  document.getElementById('totalBalance').textContent = '$' + balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('totalInvested').textContent = '$' + invested.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('totalProfit').textContent = '$' + profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  document.getElementById('referralEarnings').textContent = '$' + refEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// ========== SECTION NAVIGATION ==========
window.showSection = function(sectionName) {
  document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
  
  const section = document.getElementById(sectionName + 'Section');
  if (section) section.style.display = 'block';
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.target.closest('.nav-item').classList.add('active');
  
  const titles = {
    overview: 'Dashboard Overview',
    invest: 'Investment Plans',
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Funds',
    transfer: 'Transfer Funds',
    referral: 'Referral Program',
    transactions: 'All Transactions',
    pending: 'Pending Requests'
  };
  document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
  
  document.getElementById('sidebar').classList.remove('open');
};

// ========== MOBILE SIDEBAR ==========
window.toggleMobileSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};

// ========== MODAL FUNCTIONS ==========
window.openModal = function(modalId) {
  document.getElementById(modalId).classList.add('show');
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('show');
};

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});

// ========== INVEST MODAL ==========
window.openInvestModal = async function(plan, min, max, profit) {
  // Check if investments are blocked
  if (await isFeatureBlocked('invest')) {
    alert('🚫 Investments are currently disabled by admin.');
    return;
  }
  
  currentPlan = plan;
  currentPlanMin = min;
  currentPlanMax = max;
  currentPlanProfit = profit;
  
  const planNames = { startup: 'Startup', pro: 'Pro', ultimate: 'Ultimate' };
  document.getElementById('investModalTitle').textContent = 'Invest in ' + planNames[plan] + ' Plan';
  document.getElementById('investModalDesc').textContent = 'Min: $' + min.toLocaleString() + ' | Max: $' + (max === 999999 ? 'Unlimited' : max.toLocaleString()) + ' | Profit: ' + profit + '%';
  document.getElementById('investAmount').min = min;
  document.getElementById('investAmount').max = max === 999999 ? '' : max;
  document.getElementById('investAmount').value = '';
  document.getElementById('expectedProfit').value = '';
  
  openModal('investModal');
};

// Calculate expected profit on input
document.getElementById('investAmount').addEventListener('input', function() {
  const amount = parseFloat(this.value) || 0;
  const profit = (amount * currentPlanProfit / 100).toFixed(2);
  document.getElementById('expectedProfit').value = '$' + profit + ' (' + currentPlanProfit + '%)';
});

window.submitInvest = async function(event) {
  event.preventDefault();
  
  // Check if investments are blocked
  if (await isFeatureBlocked('invest')) {
    alert('🚫 Investments are currently disabled by admin.');
    closeModal('investModal');
    return;
  }
  
  const amount = parseFloat(document.getElementById('investAmount').value);
  
  if (amount < currentPlanMin || (currentPlanMax !== 999999 && amount > currentPlanMax)) {
    alert('Amount must be between $' + currentPlanMin + ' and $' + (currentPlanMax === 999999 ? 'Unlimited' : currentPlanMax));
    return;
  }
  
  const balance = userData.balance || 0;
  if (amount > balance) {
    alert('Insufficient balance! Please deposit first.');
    closeModal('investModal');
    showSection('deposit');
    return;
  }
  
  try {
    const investId = 'invest_' + Date.now();
    const profit = amount * currentPlanProfit / 100;
    
    // Save investment
    await set(ref(db, 'users/' + currentUser.id + '/investments/' + investId), {
      plan: currentPlan,
      amount: amount,
      profitPercent: currentPlanProfit,
      expectedProfit: profit,
      earnedProfit: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastProfitCalc: new Date().toISOString()
    });
    
    // Update balance
    await update(ref(db, 'users/' + currentUser.id), {
      balance: balance - amount,
      totalInvested: (userData.totalInvested || 0) + amount
    });
    
    // Add transaction
    await push(ref(db, 'users/' + currentUser.id + '/transactions'), {
      type: 'invest',
      amount: amount,
      plan: currentPlan,
      status: 'completed',
      date: new Date().toISOString()
    });
    
    closeModal('investModal');
    alert('✅ Investment successful!');
    await loadUserData();
    showSection('overview');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== CALCULATE PROFIT ==========
async function calculateProfit() {
  const snapshot = await get(ref(db, 'users/' + currentUser.id + '/investments'));
  const investments = snapshot.val();
  
  if (!investments) return;
  
  let totalNewProfit = 0;
  const now = new Date();
  
  for (const [id, inv] of Object.entries(investments)) {
    if (inv.status !== 'active') continue;
    
    const lastCalc = new Date(inv.lastProfitCalc || inv.createdAt);
    const hoursDiff = (now - lastCalc) / (1000 * 60 * 60);
    
    // Calculate daily profit (profit% per day)
    if (hoursDiff >= 24) {
      const days = Math.floor(hoursDiff / 24);
      const dailyProfit = (inv.amount * inv.profitPercent / 100) / 30; // Monthly profit divided by 30 days
      const earned = dailyProfit * days;
      
      totalNewProfit += earned;
      
      await update(ref(db, 'users/' + currentUser.id + '/investments/' + id), {
        earnedProfit: (inv.earnedProfit || 0) + earned,
        lastProfitCalc: now.toISOString()
      });
    }
  }
  
  if (totalNewProfit > 0) {
    await update(ref(db, 'users/' + currentUser.id), {
      totalProfit: (userData.totalProfit || 0) + totalNewProfit,
      balance: (userData.balance || 0) + totalNewProfit
    });
    
    await loadUserData();
  }
}

// ========== DEPOSIT ==========
window.openDepositModal = function(method) {
  document.getElementById('depositMethod').value = method.toUpperCase();
  document.getElementById('depositAmount').value = '';
  openModal('depositModal');
};

window.submitDeposit = async function(event) {
  event.preventDefault();
  
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const method = document.getElementById('depositMethod').value;
  
  try {
    const depositId = 'deposit_' + Date.now();
    
    // Save as pending deposit
    await set(ref(db, 'users/' + currentUser.id + '/pendingDeposits/' + depositId), {
      amount: amount,
      method: method,
      status: 'pending',
      date: new Date().toISOString()
    });
    
    // Also save to global pending for admin
    await set(ref(db, 'pendingDeposits/' + depositId), {
      userId: currentUser.id,
      userName: userData.fullName,
      userEmail: userData.email,
      amount: amount,
      method: method,
      status: 'pending',
      date: new Date().toISOString()
    });
    
    closeModal('depositModal');
    alert('✅ Deposit request submitted! It will be reviewed by admin.');
    await loadUserData();
    showSection('pending');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== WITHDRAW ==========
window.openWithdrawModal = async function(method) {
  // Check if withdrawals are blocked
  if (await isFeatureBlocked('withdraw')) {
    alert('🚫 Withdrawals are currently disabled by admin.');
    return;
  }
  
  document.getElementById('withdrawMethod').value = method.toUpperCase();
  document.getElementById('withdrawAmount').value = '';
  openModal('withdrawModal');
};

window.submitWithdraw = async function(event) {
  event.preventDefault();
  
  // Check if withdrawals are blocked
  if (await isFeatureBlocked('withdraw')) {
    alert('🚫 Withdrawals are currently disabled by admin.');
    closeModal('withdrawModal');
    return;
  }
  
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const method = document.getElementById('withdrawMethod').value;
  const balance = userData.balance || 0;
  
  if (amount > balance) {
    alert('Insufficient balance!');
    return;
  }
  
  try {
    const withdrawId = 'withdraw_' + Date.now();
    
    // Save as pending withdrawal
    await set(ref(db, 'users/' + currentUser.id + '/pendingWithdrawals/' + withdrawId), {
      amount: amount,
      method: method,
      status: 'pending',
      date: new Date().toISOString()
    });
    
    // Also save to global pending for admin
    await set(ref(db, 'pendingWithdrawals/' + withdrawId), {
      userId: currentUser.id,
      userName: userData.fullName,
      userEmail: userData.email,
      amount: amount,
      method: method,
      status: 'pending',
      date: new Date().toISOString()
    });
    
    // Deduct from balance immediately
    await update(ref(db, 'users/' + currentUser.id), {
      balance: balance - amount
    });
    
    closeModal('withdrawModal');
    alert('✅ Withdrawal request submitted! Pending admin approval.');
    await loadUserData();
    showSection('pending');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== TRANSFER ==========
window.openTransferModal = async function() {
  // Check if transfers are blocked
  if (await isFeatureBlocked('transfer')) {
    alert('🚫 Transfers are currently disabled by admin.');
    return;
  }
  
  document.getElementById('transferEmail').value = '';
  document.getElementById('transferAmount').value = '';
  openModal('transferModal');
};

window.submitTransfer = async function(event) {
  event.preventDefault();
  
  // Check if transfers are blocked
  if (await isFeatureBlocked('transfer')) {
    alert('🚫 Transfers are currently disabled by admin.');
    closeModal('transferModal');
    return;
  }
  
  const recipientEmail = document.getElementById('transferEmail').value.trim();
  const amount = parseFloat(document.getElementById('transferAmount').value);
  const balance = userData.balance || 0;
  
  if (amount > balance) {
    alert('Insufficient balance!');
    return;
  }
  
  if (recipientEmail === userData.email) {
    alert('Cannot transfer to yourself!');
    return;
  }
  
  try {
    // Find recipient
    const usersSnapshot = await get(ref(db, 'users'));
    const users = usersSnapshot.val();
    let recipientId = null;
    let recipientData = null;
    
    for (const [id, u] of Object.entries(users || {})) {
      if (u.email === recipientEmail) {
        recipientId = id;
        recipientData = u;
        break;
      }
    }
    
    if (!recipientId) {
      alert('Recipient not found!');
      return;
    }
    
    // Update sender balance
    await update(ref(db, 'users/' + currentUser.id), {
      balance: balance - amount
    });
    
    // Update recipient balance
    await update(ref(db, 'users/' + recipientId), {
      balance: (recipientData.balance || 0) + amount
    });
    
    // Add transactions for both
    await push(ref(db, 'users/' + currentUser.id + '/transactions'), {
      type: 'transfer_out',
      amount: amount,
      to: recipientEmail,
      status: 'completed',
      date: new Date().toISOString()
    });
    
    await push(ref(db, 'users/' + recipientId + '/transactions'), {
      type: 'transfer_in',
      amount: amount,
      from: userData.email,
      status: 'completed',
      date: new Date().toISOString()
    });
    
    closeModal('transferModal');
    alert('✅ Transfer successful!');
    await loadUserData();
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== LOAD ACTIVE INVESTMENTS ==========
async function loadActiveInvestments() {
  // Calculate profit first
  await calculateProfit();
  
  const container = document.getElementById('activeInvestments');
  const snapshot = await get(ref(db, 'users/' + currentUser.id + '/investments'));
  const investments = snapshot.val();
  
  if (!investments) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No active investments yet. Choose a plan!</p>';
    return;
  }
  
  let html = '';
  for (const [id, inv] of Object.entries(investments)) {
    if (inv.status === 'active') {
      const planNames = { startup: 'Startup', pro: 'Pro', ultimate: 'Ultimate' };
      const earned = inv.earnedProfit || 0;
      html += `
        <div class="investment-item">
          <div>
            <h4>${planNames[inv.plan] || inv.plan} Plan</h4>
            <p>Invested: $${inv.amount.toLocaleString()} | ${inv.profitPercent}% profit</p>
            <p style="color: var(--success); font-size: 0.8rem;">Earned so far: +$${earned.toFixed(2)}</p>
          </div>
          <div class="investment-profit">+$${inv.expectedProfit.toLocaleString()}</div>
        </div>
      `;
    }
  }
  
  container.innerHTML = html || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No active investments</p>';
}

// ========== LOAD TRANSACTIONS ==========
async function loadTransactions() {
  const snapshot = await get(ref(db, 'users/' + currentUser.id + '/transactions'));
  const transactions = snapshot.val();
  
  const recentContainer = document.getElementById('recentTransactions');
  const allContainer = document.getElementById('allTransactions');
  
  if (!transactions) {
    const emptyMsg = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No transactions yet</p>';
    recentContainer.innerHTML = emptyMsg;
    allContainer.innerHTML = emptyMsg;
    return;
  }
  
  const txList = Object.entries(transactions).sort((a, b) => new Date(b[1].date) - new Date(a[1].date));
  
  function formatTx([id, tx]) {
    const typeLabels = { invest: 'Investment', deposit: 'Deposit', withdraw: 'Withdrawal', transfer_out: 'Transfer Sent', transfer_in: 'Transfer Received' };
    const typeColors = { invest: 'invest', deposit: 'deposit', withdraw: 'withdraw', transfer_out: 'withdraw', transfer_in: 'deposit' };
    const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' ? '-' : '+';
    
    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <h4>${typeLabels[tx.type] || tx.type}</h4>
          <p>${new Date(tx.date).toLocaleDateString()}</p>
        </div>
        <div class="transaction-amount ${typeColors[tx.type] || ''}">
          <h4>${sign}$${tx.amount.toLocaleString()}</h4>
          <span class="transaction-status status-completed">${tx.status}</span>
        </div>
      </div>
    `;
  }
  
  recentContainer.innerHTML = txList.slice(0, 5).map(formatTx).join('');
  allContainer.innerHTML = txList.map(formatTx).join('');
}

// ========== LOAD PENDING ==========
async function loadPending() {
  const withdrawSnapshot = await get(ref(db, 'users/' + currentUser.id + '/pendingWithdrawals'));
  const depositSnapshot = await get(ref(db, 'users/' + currentUser.id + '/pendingDeposits'));
  
  const withdrawals = withdrawSnapshot.val();
  const deposits = depositSnapshot.val();
  
  const wContainer = document.getElementById('pendingWithdrawals');
  const dContainer = document.getElementById('pendingDeposits');
  
  if (!withdrawals) {
    wContainer.innerHTML = '<h4>No pending withdrawals</h4><p style="color: var(--text-muted); font-size: 0.85rem;">Your withdrawal requests will appear here.</p>';
  } else {
    let html = '<h4>Pending Withdrawals</h4>';
    for (const [id, w] of Object.entries(withdrawals)) {
      if (w.status === 'pending') {
        html += `
          <div class="pending-item">
            <span style="color: var(--text-light);">$${w.amount.toLocaleString()}</span>
            <span class="transaction-status status-pending">PENDING</span>
          </div>
        `;
      }
    }
    wContainer.innerHTML = html;
  }
  
  if (!deposits) {
    dContainer.innerHTML = '<h4>No pending deposits</h4><p style="color: var(--text-muted); font-size: 0.85rem;">Your deposit requests will appear here.</p>';
  } else {
    let html = '<h4>Pending Deposits</h4>';
    for (const [id, d] of Object.entries(deposits)) {
      if (d.status === 'pending') {
        html += `
          <div class="pending-item">
            <span style="color: var(--text-light);">$${d.amount.toLocaleString()} (${d.method})</span>
            <span class="transaction-status status-pending">PENDING</span>
          </div>
        `;
      }
    }
    dContainer.innerHTML = html;
  }
}

// ========== REFERRAL ==========
window.copyReferral = function() {
  const input = document.getElementById('referralLink');
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('Referral link copied!');
};

async function loadReferralStats() {
  const snapshot = await get(ref(db, 'users'));
  const users = snapshot.val();
  
  let count = 0;
  let earned = 0;
  
  for (const u of Object.values(users || {})) {
    if (u.referredBy === currentUser.id) {
      count++;
    }
  }
  
  document.getElementById('totalReferrals').textContent = count;
  document.getElementById('totalReferralEarned').textContent = '$' + (userData.referralEarnings || 0).toLocaleString();
}

// ========== LOGOUT ==========
window.logout = function() {
  document.getElementById('logoutOverlay').classList.add('show');
  
  setTimeout(() => {
    sessionStorage.removeItem('apexvault_user');
    window.location.href = 'login.html';
  }, 1500);
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkLogin()) return;
  
  // Show login animation for 1.5 seconds
  setTimeout(async () => {
    document.getElementById('loginOverlay').classList.add('hidden');
    await loadUserData();
  }, 1500);
});

