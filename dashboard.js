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

// ========== CONFIG ==========
const DAILY_WITHDRAW_LIMIT = 10000;
const WITHDRAW_FEE_RATE = 0.02; // 2% fee

// Admin deposit addresses - UPDATE THESE WITH YOUR REAL ADDRESSES
const DEPOSIT_ADDRESSES = {
  USDT_BEP20: "0x681ef5FF6d9e2FD31ce87Cd256d09a0e4755F9d9",
  USDT_TRC20: "TBdkLH7z9d6p6NKk3pZcoDdMzwoSxTfcQA"
};

// ========== GLOBAL STATE ==========
let currentUser = null;
let userData = null;
let currentPlan = null;
let currentPlanMin = 0;
let currentPlanMax = 0;
let currentPlanProfit = 0;
let allTransactions = [];
let currentHistoryFilter = 'all';
let activeInvestment = null;

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

// ========== GET TODAY KEY ==========
function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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
  await loadActiveInvestments();
  
  // Load transactions
  await loadTransactions();
  
  // Load pending
  loadPending();
  
  // Update referral link
  const refLink = 'https://apexvault.com/ref/' + currentUser.id;
  document.getElementById('referralLink').value = refLink;
  
  // Load referral stats
  loadReferralStats();
  
  // Update withdraw limit display
  updateWithdrawLimitDisplay();
  
  // Check investment lock
  checkInvestmentLock();
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

// ========== WITHDRAW LIMIT DISPLAY ==========
async function updateWithdrawLimitDisplay() {
  const todayKey = getTodayKey();
  const dailyRef = ref(db, 'users/' + currentUser.id + '/dailyWithdrawals/' + todayKey);
  
  try {
    const snapshot = await get(dailyRef);
    const dailyUsed = snapshot.exists() ? snapshot.val() : 0;
    const remaining = Math.max(0, DAILY_WITHDRAW_LIMIT - dailyUsed);
    const percentage = (dailyUsed / DAILY_WITHDRAW_LIMIT) * 100;
    
    // Update banner
    const bannerAmount = document.getElementById('dailyLimitAmount');
    const bannerFill = document.getElementById('dailyLimitFill');
    const modalRemaining = document.getElementById('withdrawRemaining');
    
    if (bannerAmount) {
      bannerAmount.textContent = `$${dailyUsed.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / $${DAILY_WITHDRAW_LIMIT.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    if (bannerFill) {
      bannerFill.style.width = `${Math.min(percentage, 100)}%`;
      bannerFill.style.background = percentage > 80 
        ? 'linear-gradient(90deg, #ef4444, #f59e0b)' 
        : 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))';
    }
    if (modalRemaining) {
      modalRemaining.textContent = `$${remaining.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  } catch (err) {
    console.error("Error loading daily limit:", err);
  }
}

// ========== INVESTMENT LOCK ==========
async function checkInvestmentLock() {
  const snapshot = await get(ref(db, 'users/' + currentUser.id + '/investments'));
  const investments = snapshot.val();
  
  const statusEl = document.getElementById('investmentStatus');
  const plansGrid = document.getElementById('plansGrid');
  const lockTimer = document.getElementById('lockTimer');
  
  if (!investments) {
    statusEl.style.display = 'none';
    plansGrid.style.display = 'grid';
    activeInvestment = null;
    return;
  }
  
  // Find active investment
  let hasActive = false;
  let activeInv = null;
  
  for (const [id, inv] of Object.entries(investments)) {
    if (inv.status === 'active') {
      hasActive = true;
      activeInv = inv;
      activeInv.id = id;
      break;
    }
  }
  
  if (hasActive && activeInv) {
    activeInvestment = activeInv;
    statusEl.style.display = 'block';
    plansGrid.style.display = 'none';
    
    // Calculate time remaining (30 days from creation)
    const created = new Date(activeInv.createdAt);
    const endDate = new Date(created.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diff = endDate - now;
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      lockTimer.textContent = `Time remaining: ${days}d ${hours}h`;
    } else {
      // Investment completed - auto-release
      await completeInvestment(activeInv.id);
      statusEl.style.display = 'none';
      plansGrid.style.display = 'grid';
      activeInvestment = null;
    }
  } else {
    statusEl.style.display = 'none';
    plansGrid.style.display = 'grid';
    activeInvestment = null;
  }
}

async function completeInvestment(investId) {
  const inv = activeInvestment;
  if (!inv) return;
  
  const totalReturn = inv.amount + inv.expectedProfit;
  
  await update(ref(db, 'users/' + currentUser.id + '/investments/' + investId), {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
  
  await update(ref(db, 'users/' + currentUser.id), {
    balance: (userData.balance || 0) + totalReturn,
    totalInvested: Math.max(0, (userData.totalInvested || 0) - inv.amount)
  });
  
  // Add to history
  await push(ref(db, 'users/' + currentUser.id + '/history'), {
    type: 'invest_return',
    amount: totalReturn,
    originalAmount: inv.amount,
    profit: inv.expectedProfit,
    plan: inv.plan,
    status: 'completed',
    date: new Date().toISOString(),
    timestamp: Date.now()
  });
  
  alert('🎉 Your investment has matured! $' + totalReturn.toLocaleString() + ' has been added to your balance.');
  await loadUserData();
}

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
    overview: 'Dashboard Overview',
    invest: 'Investment Plans',
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Funds',
    transfer: 'Transfer Funds',
    history: 'Transaction History',
    referral: 'Referral Program',
    pending: 'Pending Requests'
  };
  document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
  
  document.getElementById('sidebar').classList.remove('open');
  
  // Refresh data when visiting sections
  if (sectionName === 'withdraw') updateWithdrawLimitDisplay();
  if (sectionName === 'history') renderHistory();
  if (sectionName === 'invest') checkInvestmentLock();
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
  if (await isFeatureBlocked('invest')) {
    alert('🚫 Investments are currently disabled by admin.');
    return;
  }
  
  // Check if already has active investment
  if (activeInvestment) {
    alert('🔒 You already have an active investment. Please wait for it to complete.');
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
  
  if (await isFeatureBlocked('invest')) {
    alert('🚫 Investments are currently disabled by admin.');
    closeModal('investModal');
    return;
  }
  
  if (activeInvestment) {
    alert('🔒 You already have an active investment. Please wait for it to complete.');
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
    
    // Add to history
    await push(ref(db, 'users/' + currentUser.id + '/history'), {
      type: 'invest',
      amount: amount,
      plan: currentPlan,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    closeModal('investModal');
    alert('✅ Investment successful! Your funds are locked for 30 days.');
    await loadUserData();
    showSection('overview');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== DEPOSIT MODAL ==========
window.openDepositModal = function() {
  document.getElementById('depositAmount').value = '';
  document.getElementById('depositNetwork').value = '';
  document.getElementById('depositAddressGroup').style.display = 'none';
  document.getElementById('depositAddress').value = '';
  document.getElementById('addressHint').textContent = '';
  openModal('depositModal');
};

// Show address when network selected
document.getElementById('depositNetwork').addEventListener('change', function() {
  const network = this.value;
  const addressGroup = document.getElementById('depositAddressGroup');
  const addressInput = document.getElementById('depositAddress');
  const hint = document.getElementById('addressHint');
  
  if (network && DEPOSIT_ADDRESSES[network]) {
    addressGroup.style.display = 'block';
    addressInput.value = DEPOSIT_ADDRESSES[network];
    hint.textContent = `Send only ${network.replace('_', ' ')} to this address. Other networks will be lost.`;
  } else {
    addressGroup.style.display = 'none';
  }
});

window.copyDepositAddress = function() {
  const input = document.getElementById('depositAddress');
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('Address copied to clipboard!');
};

window.submitDeposit = async function(event) {
  event.preventDefault();
  
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const network = document.getElementById('depositNetwork').value;
  
  if (!network) {
    alert('Please select a network');
    return;
  }
  
  try {
    const depositId = 'deposit_' + Date.now();
    
    // Save as pending deposit
    await set(ref(db, 'users/' + currentUser.id + '/pendingDeposits/' + depositId), {
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Also save to global pending for admin
    await set(ref(db, 'pendingDeposits/' + depositId), {
      userId: currentUser.id,
      userName: userData.fullName,
      userEmail: userData.email,
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Add to history
    await push(ref(db, 'users/' + currentUser.id + '/history'), {
      type: 'deposit',
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    closeModal('depositModal');
    alert('✅ Deposit request submitted! Send ' + amount + ' USDT to the shown address. It will be reviewed by admin.');
    await loadUserData();
    showSection('pending');
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ========== WITHDRAW MODAL ==========
window.openWithdrawModal = async function() {
  if (await isFeatureBlocked('withdraw')) {
    alert('🚫 Withdrawals are currently disabled by admin.');
    return;
  }
  
  document.getElementById('withdrawAmount').value = '';
  document.getElementById('withdrawWalletAddress').value = '';
  document.getElementById('withdrawNetwork').value = '';
  document.getElementById('withdrawFee').textContent = '$0.00';
  document.getElementById('withdrawTotal').textContent = '$0.00';
  
  await updateWithdrawLimitDisplay();
  openModal('withdrawModal');
};

// Calculate fee on input
document.getElementById('withdrawAmount').addEventListener('input', function() {
  const amount = parseFloat(this.value) || 0;
  const fee = amount * WITHDRAW_FEE_RATE;
  const total = amount + fee;
  document.getElementById('withdrawFee').textContent = '$' + fee.toFixed(2);
  document.getElementById('withdrawTotal').textContent = '$' + total.toFixed(2);
});

window.submitWithdraw = async function(event) {
  event.preventDefault();
  
  if (await isFeatureBlocked('withdraw')) {
    alert('🚫 Withdrawals are currently disabled by admin.');
    closeModal('withdrawModal');
    return;
  }
  
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const network = document.getElementById('withdrawNetwork').value;
  const walletAddress = document.getElementById('withdrawWalletAddress').value.trim();
  const balance = userData.balance || 0;
  const fee = amount * WITHDRAW_FEE_RATE;
  const total = amount + fee;
  
  if (!network) {
    alert('Please select a network');
    return;
  }
  
  if (!walletAddress) {
    alert('Please enter your wallet address');
    return;
  }
  
  if (amount > balance) {
    alert('Insufficient balance!');
    return;
  }
  
  // Check daily limit
  const todayKey = getTodayKey();
  const dailySnapshot = await get(ref(db, 'users/' + currentUser.id + '/dailyWithdrawals/' + todayKey));
  const dailyUsed = dailySnapshot.exists() ? dailySnapshot.val() : 0;
  
  if ((dailyUsed + amount) > DAILY_WITHDRAW_LIMIT) {
    alert(`Daily limit exceeded! You can only withdraw $${(DAILY_WITHDRAW_LIMIT - dailyUsed).toFixed(2)} more today.`);
    return;
  }
  
  try {
    const withdrawId = 'withdraw_' + Date.now();
    
    // Save as pending withdrawal
    await set(ref(db, 'users/' + currentUser.id + '/pendingWithdrawals/' + withdrawId), {
      amount: amount,
      fee: fee,
      total: total,
      network: network,
      walletAddress: walletAddress,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Also save to global pending for admin
    await set(ref(db, 'pendingWithdrawals/' + withdrawId), {
      userId: currentUser.id,
      userName: userData.fullName,
      userEmail: userData.email,
      amount: amount,
      fee: fee,
      total: total,
      network: network,
      walletAddress: walletAddress,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Update daily usage
    await update(ref(db, 'users/' + currentUser.id + '/dailyWithdrawals/' + todayKey), dailyUsed + amount);
    
    // Deduct from balance immediately
    await update(ref(db, 'users/' + currentUser.id), {
      balance: balance - total
    });
    
    // Add to history
    await push(ref(db, 'users/' + currentUser.id + '/history'), {
      type: 'withdraw',
      amount: amount,
      fee: fee,
      total: total,
      network: network,
      walletAddress: walletAddress,
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
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
    
    // Add to sender history
    await push(ref(db, 'users/' + currentUser.id + '/history'), {
      type: 'transfer_out',
      amount: amount,
      to: recipientEmail,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
    
    // Add to recipient history
    await push(ref(db, 'users/' + recipientId + '/history'), {
      type: 'transfer_in',
      amount: amount,
      from: userData.email,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
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
      
      // Calculate time remaining
      const created = new Date(inv.createdAt);
      const endDate = new Date(created.getTime() + (30 * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diff = endDate - now;
      let timeText = 'Completed';
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeText = `${days}d ${hours}h remaining`;
      }
      
      html += `
        <div class="investment-item">
          <div>
            <h4>${planNames[inv.plan] || inv.plan} Plan</h4>
            <p>Invested: $${inv.amount.toLocaleString()} | ${inv.profitPercent}% profit</p>
            <p style="color: var(--accent); font-size: 0.8rem;">${timeText}</p>
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
  const snapshot = await get(ref(db, 'users/' + currentUser.id + '/history'));
  const history = snapshot.val();
  
  const recentContainer = document.getElementById('recentTransactions');
  
  if (!history) {
    recentContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No activity yet</p>';
    allTransactions = [];
    return;
  }
  
  allTransactions = Object.entries(history).map(([id, tx]) => ({ id, ...tx }))
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Recent activity (last 5)
  recentContainer.innerHTML = allTransactions.slice(0, 5).map(formatTransaction).join('');
  
  // Render full history
  renderHistory();
}

function formatTransaction(tx) {
  const typeLabels = { 
    invest: 'Investment', 
    invest_return: 'Investment Return',
    deposit: 'Deposit', 
    withdraw: 'Withdrawal', 
    transfer_out: 'Transfer Sent', 
    transfer_in: 'Transfer Received' 
  };
  const typeColors = { 
    invest: 'invest', 
    invest_return: 'deposit',
    deposit: 'deposit', 
    withdraw: 'withdraw', 
    transfer_out: 'withdraw', 
    transfer_in: 'deposit' 
  };
  const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' ? '-' : '+';
  const isPending = tx.status === 'pending';
  
  return `
    <div class="transaction-item">
      <div class="transaction-info">
        <h4>${typeLabels[tx.type] || tx.type}</h4>
        <p>${new Date(tx.date).toLocaleDateString()}</p>
      </div>
      <div class="transaction-amount ${typeColors[tx.type] || ''}">
        <h4>${sign}$${tx.amount.toLocaleString()}</h4>
        <span class="transaction-status ${isPending ? 'status-pending' : 'status-completed'}">${tx.status}</span>
      </div>
    </div>
  `;
}

// ========== HISTORY SECTION ==========
window.filterHistory = function(filter) {
  currentHistoryFilter = filter;
  
  // Update buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderHistory();
};

function renderHistory() {
  const container = document.getElementById('historyList');
  
  if (!allTransactions.length) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No transactions yet</p>';
    return;
  }
  
  let filtered = allTransactions;
  if (currentHistoryFilter !== 'all') {
    filtered = allTransactions.filter(tx => {
      if (currentHistoryFilter === 'transfer') {
        return tx.type === 'transfer_out' || tx.type === 'transfer_in';
      }
      return tx.type === currentHistoryFilter || 
             (currentHistoryFilter === 'invest' && tx.type === 'invest_return');
    });
  }
  
  if (!filtered.length) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No transactions in this category</p>';
    return;
  }
  
  const typeIcons = {
    deposit: '💰',
    withdraw: '💸',
    invest: '📈',
    invest_return: '🎉',
    transfer_out: '📤',
    transfer_in: '📥'
  };
  
  const typeLabels = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    invest: 'Investment',
    invest_return: 'Investment Return',
    transfer_out: 'Transfer Sent',
    transfer_in: 'Transfer Received'
  };
  
  container.innerHTML = filtered.map(tx => {
    const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in' || tx.type === 'invest_return';
    const isNegative = tx.type === 'withdraw' || tx.type === 'transfer_out' || tx.type === 'invest';
    
    return `
      <div class="history-item">
        <div style="display: flex; align-items: center;">
          <div class="history-icon ${tx.type}">${typeIcons[tx.type] || '📋'}</div>
          <div class="history-details">
            <h4>${typeLabels[tx.type] || tx.type}</h4>
            <p>${new Date(tx.date).toLocaleDateString()} • ${new Date(tx.date).toLocaleTimeString()}</p>
            ${tx.network ? `<p style="font-size: 0.7rem; color: var(--accent);">${tx.network.replace('_', ' ')}</p>` : ''}
          </div>
        </div>
        <div class="history-meta">
          <div class="amount ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}">
            ${isPositive ? '+' : isNegative ? '-' : ''}$${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <span class="status ${tx.status}">${tx.status}</span>
        </div>
      </div>
    `;
  }).join('');
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
            <span style="color: var(--text-light);">$${w.amount.toLocaleString()} ${w.network ? '(' + w.network.replace('_', ' ') + ')' : ''}</span>
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
            <span style="color: var(--text-light);">$${d.amount.toLocaleString()} ${d.network ? '(' + d.network.replace('_', ' ') + ')' : ''}</span>
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
