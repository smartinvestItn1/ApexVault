// ========== APEXVAULT DASHBOARD JAVASCRIPT ==========
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

// ========== CONFIG ==========
const DAILY_WITHDRAW_LIMIT = 10000;
const WITHDRAW_FEE_RATE = 0;
const REFERRAL_BONUS_PERCENT = 5; // Referrer earns 5% of investment
let DEPOSIT_ADDRESSES = {
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
let currentPlanDuration = 24;
let allTransactions = [];
let currentHistoryFilter = 'all';
let activeInvestment = null;
let uid;

// ========== SUCCESS ANIMATION ==========
window.showSuccessAnimation = function(message, subtext, redirectTo) {
  const overlay = document.getElementById('successOverlay');
  const textEl = document.getElementById('successText');
  const subEl = document.getElementById('successSubtext');

  if (textEl) textEl.textContent = message;
  if (subEl) subEl.textContent = subtext || 'Please wait...';
  if (overlay) overlay.classList.add('show');

  setTimeout(() => {
    if (overlay) overlay.classList.remove('show');
    if (redirectTo) {
      showSection(redirectTo);
    }
  }, 2500);
};

// ========== LOAD DEPOSIT ADDRESSES FROM FIREBASE ==========
async function loadDepositAddresses() {
  try {
    const snapshot = await get(ref(db, 'platformSettings/depositAddresses'));
    if (snapshot.exists()) {
      const addresses = snapshot.val();
      if (addresses.USDT_BEP20) DEPOSIT_ADDRESSES.USDT_BEP20 = addresses.USDT_BEP20;
      if (addresses.USDT_TRC20) DEPOSIT_ADDRESSES.USDT_TRC20 = addresses.USDT_TRC20;
    }
  } catch (err) {
    console.error('Error loading deposit addresses:', err);
  }
}

// ========== CHECK LOGIN ==========
function checkLogin() {
  const userJson = sessionStorage.getItem('apexvault_user');
  if (!userJson) {
    window.location.href = 'login.html';
    return false;
  }
  currentUser = JSON.parse(userJson);

  if (!currentUser.uid && currentUser.id) {
    currentUser.uid = currentUser.id;
  }
  if (!currentUser.id && currentUser.uid) {
    currentUser.id = currentUser.uid;
  }

  uid = currentUser.uid;
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

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats() {
  const balance = userData.balance || 0;
  const invested = userData.totalInvested || 0;
  const profit = userData.totalProfit || 0;
  const refEarned = userData.referralEarnings || 0;

  const balEl = document.getElementById('totalBalance');
  const invEl = document.getElementById('totalInvested');
  const profEl = document.getElementById('totalProfit');
  const refEl = document.getElementById('referralEarnings');

  if (balEl) balEl.textContent = '$' + balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  if (invEl) invEl.textContent = '$' + invested.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  if (profEl) profEl.textContent = '$' + profit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  if (refEl) refEl.textContent = '$' + refEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

async function loadUserData() {
  if (!currentUser) return;

  uid = currentUser.uid;

  const snapshot = await get(ref(db, 'users/' + currentUser.uid));
  userData = snapshot.val() || {};

  if (userData.balance === undefined) {
    await update(ref(db, 'users/' + currentUser.uid), { balance: 0 });
    userData.balance = 0;
  }

  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');

  if (userNameEl) userNameEl.textContent = userData.fullName || 'User';
  if (userEmailEl) userEmailEl.textContent = userData.email || '';
  if (userAvatarEl) userAvatarEl.textContent = (userData.fullName || 'U').charAt(0).toUpperCase();

  updateDashboardStats();
  await loadActiveInvestments();
  await loadTransactions();
  loadPending();

  const refLink = 'https://smartinvestitn1.github.io/ApexVault/create-account.html?ref=' + currentUser.uid;
  const refLinkEl = document.getElementById('referralLink');
  if (refLinkEl) refLinkEl.value = refLink;

  loadReferralStats();
  updateWithdrawLimitDisplay();
  checkInvestmentLock();
}

// ========== WITHDRAW LIMIT DISPLAY ==========
async function updateWithdrawLimitDisplay() {
  const bannerAmount = document.getElementById('dailyLimitAmount');
  const bannerFill = document.getElementById('dailyLimitFill');
  const modalRemaining = document.getElementById('withdrawRemaining');

  const kycApproved = userData.kyc && userData.kyc.status === 'approved';
  if (kycApproved) {
    if (bannerAmount) bannerAmount.textContent = 'Unlimited';
    if (bannerFill) bannerFill.style.width = '0%';
    if (modalRemaining) modalRemaining.textContent = 'Unlimited';
    return;
  }

  const todayKey = getTodayKey();
  const dailyRef = ref(db, 'users/' + currentUser.uid + '/dailyWithdrawals/' + todayKey);

  try {
    const snapshot = await get(dailyRef);
    const dailyUsed = snapshot.exists() ? snapshot.val() : 0;
    const remaining = Math.max(0, DAILY_WITHDRAW_LIMIT - dailyUsed);
    const percentage = (dailyUsed / DAILY_WITHDRAW_LIMIT) * 100;

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
  const snapshot = await get(ref(db, 'users/' + currentUser.uid + '/investments'));
  const investments = snapshot.val();

  const statusEl = document.getElementById('investmentStatus');
  const plansGrid = document.getElementById('plansGrid');
  const lockTimer = document.getElementById('lockTimer');

  if (!investments) {
    if (statusEl) statusEl.style.display = 'none';
    if (plansGrid) plansGrid.style.display = 'grid';
    activeInvestment = null;
    return;
  }

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
    if (statusEl) statusEl.style.display = 'flex';
    if (plansGrid) plansGrid.style.display = 'none';

    const created = new Date(activeInv.createdAt);
    const durationMs = (activeInv.durationHours || 24) * 60 * 60 * 1000;
    const endDate = new Date(created.getTime() + durationMs);
    const now = new Date();
    const diff = endDate - now;

    if (diff > 0) {
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (lockTimer) lockTimer.textContent = `Time remaining: ${totalHours}h ${mins}m`;
    } else {
      await completeInvestment(activeInv.id);
      if (statusEl) statusEl.style.display = 'none';
      if (plansGrid) plansGrid.style.display = 'grid';
      activeInvestment = null;
    }
  } else {
    if (statusEl) statusEl.style.display = 'none';
    if (plansGrid) plansGrid.style.display = 'grid';
    activeInvestment = null;
  }
}

async function completeInvestment(investId) {
  const inv = activeInvestment;
  if (!inv) return;

  const totalReturn = inv.amount + inv.expectedProfit;

  await update(ref(db, 'users/' + currentUser.uid + '/investments/' + investId), {
    status: 'completed',
    completedAt: new Date().toISOString()
  });

  await update(ref(db, 'users/' + currentUser.uid), {
    balance: (userData.balance || 0) + totalReturn,
    totalInvested: Math.max(0, (userData.totalInvested || 0) - inv.amount),
    totalProfit: (userData.totalProfit || 0) + inv.expectedProfit
  });

  await push(ref(db, 'users/' + currentUser.uid + '/history'), {
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

  // FIX: Update sidebar active state (.drawer-link)
  document.querySelectorAll('.drawer-link').forEach(link => link.classList.remove('active'));
  document.querySelectorAll('.drawer-link').forEach(link => {
    const onclickStr = link.getAttribute('onclick') || '';
    if (onclickStr.includes("showSection('" + sectionName + "')")) {
      link.classList.add('active');
    }
  });

  // FIX: Update bottom nav active state (.nav-tab)
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const onclickStr = tab.getAttribute('onclick') || '';
    if (onclickStr.includes("showSection('" + sectionName + "')")) {
      tab.classList.add('active');
    }
  });

  const titles = {
    overview: 'Dashboard',
    invest: 'Investment Plans',
    deposit: 'Deposit Funds',
    withdraw: 'Withdraw Funds',
    transfer: 'Transfer Funds',
    history: 'Transaction History',
    referral: 'Referral Program',
    pending: 'Pending Requests',
    kyc: 'KYC Verification'
  };

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = titles[sectionName] || 'Dashboard';

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('drawerOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  if (sectionName === 'withdraw') updateWithdrawLimitDisplay();
  if (sectionName === 'history') renderHistory();
  if (sectionName === 'invest') checkInvestmentLock();
};

// ========== KYC ==========
window.showKYC = function() {
  showSection('kyc');
};

// ========== MOBILE SIDEBAR ==========
window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('drawerOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
};

// ========== MODAL FUNCTIONS ==========
window.openModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('show');
};

window.closeModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('show');
};

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

  if (activeInvestment) {
    alert('🔒 You already have an active investment. Please wait for it to complete.');
    return;
  }

  const planDurations = { startup: 24, pro: 48, ultimate: 72 };

  currentPlan = plan;
  currentPlanMin = min;
  currentPlanMax = max;
  currentPlanProfit = profit;
  currentPlanDuration = planDurations[plan] || 24;

  const planNames = { startup: 'Startup', pro: 'Pro', ultimate: 'Ultimate' };
  const titleEl = document.getElementById('investModalTitle');
  const descEl = document.getElementById('investModalDesc');
  const amountEl = document.getElementById('investAmount');
  const profitEl = document.getElementById('expectedProfit');

  if (titleEl) titleEl.textContent = 'Invest in ' + planNames[plan] + ' Plan';
  if (descEl) descEl.textContent = 'Min: $' + min.toLocaleString() + ' | Max: $' + (max === 999999 ? 'Unlimited' : max.toLocaleString()) + ' | Profit: ' + profit + '% | Lock: ' + currentPlanDuration + 'h';
  if (amountEl) { amountEl.min = min; amountEl.max = max === 999999 ? '' : max; amountEl.value = ''; }
  if (profitEl) profitEl.value = '';

  openModal('investModal');
};

// Calculate expected profit on input
const investAmountInput = document.getElementById('investAmount');
if (investAmountInput) {
  investAmountInput.addEventListener('input', function() {
    const amount = parseFloat(this.value) || 0;
    const profit = (amount * currentPlanProfit / 100).toFixed(2);
    const el = document.getElementById('expectedProfit');
    if (el) el.value = '$' + profit + ' (' + currentPlanProfit + '%)';
  });
}

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

    await set(ref(db, 'users/' + currentUser.uid + '/investments/' + investId), {
      plan: currentPlan,
      amount: amount,
      profitPercent: currentPlanProfit,
      expectedProfit: profit,
      earnedProfit: 0,
      status: 'active',
      durationHours: currentPlanDuration,
      createdAt: new Date().toISOString(),
      lastProfitCalc: new Date().toISOString()
    });

    await update(ref(db, 'users/' + currentUser.uid), {
      balance: balance - amount,
      totalInvested: (userData.totalInvested || 0) + amount
    });

    // ========== REFERRAL BONUS (FIRST INVESTMENT ONLY) ==========
    if (userData.referredBy && !userData.referralBonusPaid) {
      const bonus = amount * (REFERRAL_BONUS_PERCENT / 100);

      try {
        const referrerRef = ref(db, 'users/' + userData.referredBy);
        const referrerSnap = await get(referrerRef);
        const referrerData = referrerSnap.val();

        if (referrerData) {
          await update(referrerRef, {
            balance: (referrerData.balance || 0) + bonus,
            referralEarnings: (referrerData.referralEarnings || 0) + bonus
          });

          await push(ref(db, 'users/' + userData.referredBy + '/history'), {
            type: 'referral_bonus',
            amount: bonus,
            fromUser: currentUser.uid,
            fromName: userData.fullName || 'User',
            status: 'completed',
            date: new Date().toISOString(),
            timestamp: Date.now()
          });

          // Mark bonus as paid so it never triggers again
          await update(ref(db, 'users/' + currentUser.uid), {
            referralBonusPaid: true
          });
        }
      } catch (err) {
        console.error('Referral bonus failed:', err);
      }
    }

    await push(ref(db, 'users/' + currentUser.uid + '/history'), {
      type: 'invest',
      amount: amount,
      plan: currentPlan,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    closeModal('investModal');
    showSuccessAnimation('Investment Registered', 'Redirecting to dashboard...', 'overview');
    await loadUserData();

  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

window.openNotifications = function() {
  alert('🔔 No new notifications');
};

// ========== DEPOSIT MODAL ==========
window.openDepositModal = function() {
  const amountEl = document.getElementById('depositAmount');
  const networkEl = document.getElementById('depositNetwork');
  const groupEl = document.getElementById('depositAddressGroup');
  const addressEl = document.getElementById('depositAddress');
  const hintEl = document.getElementById('addressHint');

  if (amountEl) amountEl.value = '';
  if (networkEl) networkEl.value = '';
  if (groupEl) groupEl.style.display = 'none';
  if (addressEl) addressEl.value = '';
  if (hintEl) hintEl.textContent = '';

  openModal('depositModal');
};

const depositNetworkSelect = document.getElementById('depositNetwork');
if (depositNetworkSelect) {
  depositNetworkSelect.addEventListener('change', function() {
    const network = this.value;
    const groupEl = document.getElementById('depositAddressGroup');
    const addressEl = document.getElementById('depositAddress');
    const hintEl = document.getElementById('addressHint');

    if (network && DEPOSIT_ADDRESSES[network]) {
      if (groupEl) groupEl.style.display = 'block';
      if (addressEl) addressEl.value = DEPOSIT_ADDRESSES[network];
      if (hintEl) hintEl.textContent = `Send only ${network.replace('_', ' ')} to this address. Other networks will be lost.`;
    } else {
      if (groupEl) groupEl.style.display = 'none';
    }
  });
}

window.copyDepositAddress = function() {
  const input = document.getElementById('depositAddress');
  if (!input) return;
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

    await set(ref(db, 'users/' + currentUser.uid + '/pendingDeposits/' + depositId), {
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await set(ref(db, 'pendingDeposits/' + depositId), {
      userId: currentUser.uid,
      userName: userData.fullName,
      userEmail: userData.email,
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    await push(ref(db, 'users/' + currentUser.uid + '/history'), {
      type: 'deposit',
      amount: amount,
      network: network,
      method: 'crypto',
      status: 'pending',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

    closeModal('depositModal');
    showSuccessAnimation('Deposit Registered', 'Your deposit request has been submitted.', 'pending');
    await loadUserData();

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

  const amountEl = document.getElementById('withdrawAmount');
  const walletEl = document.getElementById('withdrawWalletAddress');
  const networkEl = document.getElementById('withdrawNetwork');
  const feeEl = document.getElementById('withdrawFee');
  const totalEl = document.getElementById('withdrawTotal');

  if (amountEl) amountEl.value = '';
  if (walletEl) walletEl.value = '';
  if (networkEl) networkEl.value = '';
  if (feeEl) feeEl.textContent = '$0.00';
  if (totalEl) totalEl.textContent = '$0.00';

  await updateWithdrawLimitDisplay();
  openModal('withdrawModal');
};

// ========== WITHDRAW SUBMIT — FIXED ==========
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

  if (!network) { alert('Please select a network'); return; }
  if (!walletAddress) { alert('Please enter your wallet address'); return; }
  if (amount > balance) { alert('Insufficient balance!'); return; }

  const kycApproved = userData.kyc && userData.kyc.status === 'approved';

  /* FIX: Declare these OUTSIDE the if block so the try block can use them */
  const todayKey = getTodayKey();
  let dailyUsed = 0;

  if (!kycApproved) {
    const dailySnapshot = await get(ref(db, 'users/' + currentUser.uid + '/dailyWithdrawals/' + todayKey));
    dailyUsed = dailySnapshot.exists() ? dailySnapshot.val() : 0;

    if ((dailyUsed + amount) > DAILY_WITHDRAW_LIMIT) {
      alert(`Daily limit exceeded! You can only withdraw $${(DAILY_WITHDRAW_LIMIT - dailyUsed).toFixed(2)} more today.`);
      return;
    }
  }

  try {
    const withdrawId = 'withdraw_' + Date.now();

    await set(ref(db, 'users/' + currentUser.uid + '/pendingWithdrawals/' + withdrawId), {
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

    await set(ref(db, 'pendingWithdrawals/' + withdrawId), {
      userId: currentUser.uid,
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

    /* FIX: Only track daily limit for non-KYC users */
    if (!kycApproved) {
      await set(ref(db, 'users/' + currentUser.uid + '/dailyWithdrawals/' + todayKey), dailyUsed + amount);
    }

    await update(ref(db, 'users/' + currentUser.uid), {
      balance: balance - total
    });

    await push(ref(db, 'users/' + currentUser.uid + '/history'), {
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
    showSuccessAnimation('Withdraw Registered', 'Your withdrawal request has been submitted.', 'pending');
    await loadUserData();

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

  const emailEl = document.getElementById('transferEmail');
  const amountEl = document.getElementById('transferAmount');
  if (emailEl) emailEl.value = '';
  if (amountEl) amountEl.value = '';

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

  if (amount > balance) { alert('Insufficient balance!'); return; }
  if (recipientEmail === userData.email) { alert('Cannot transfer to yourself!'); return; }

  try {
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

    if (!recipientId) { alert('Recipient not found!'); return; }

    await update(ref(db, 'users/' + currentUser.uid), {
      balance: balance - amount
    });

    await update(ref(db, 'users/' + recipientId), {
      balance: (recipientData.balance || 0) + amount
    });

    await push(ref(db, 'users/' + currentUser.uid + '/history'), {
      type: 'transfer_out',
      amount: amount,
      to: recipientEmail,
      status: 'completed',
      date: new Date().toISOString(),
      timestamp: Date.now()
    });

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
  const snapshot = await get(ref(db, 'users/' + currentUser.uid + '/investments'));
  const investments = snapshot.val();

  if (!investments || !container) {
    if (container) container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No active investments yet. Choose a plan!</p></div>';
    return;
  }

  let html = '';
  for (const [id, inv] of Object.entries(investments)) {
    if (inv.status === 'active') {
      const planNames = { startup: 'Startup', pro: 'Pro', ultimate: 'Ultimate' };
      const earned = inv.earnedProfit || 0;

      const created = new Date(inv.createdAt);
      const durationMs = (inv.durationHours || 24) * 60 * 60 * 1000;
      const endDate = new Date(created.getTime() + durationMs);
      const now = new Date();
      const diff = endDate - now;
      let timeText = 'Completed';
      if (diff > 0) {
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeText = `${totalHours}h ${mins}m remaining`;
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

  container.innerHTML = html || '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No active investments</p></div>';
}

// ========== LOAD TRANSACTIONS ==========
async function loadTransactions() {
  const snapshot = await get(ref(db, 'users/' + currentUser.uid + '/history'));
  const history = snapshot.val();

  const recentContainer = document.getElementById('recentTransactions');

  if (!history) {
    if (recentContainer) recentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No activity yet</p></div>';
    allTransactions = [];
    return;
  }

  allTransactions = Object.entries(history).map(([id, tx]) => ({ id, ...tx }))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (recentContainer) {
    recentContainer.innerHTML = allTransactions.slice(0, 5).map(formatTransaction).join('');
  }

  renderHistory();
}

function formatTransaction(tx) {
  const typeLabels = { 
    invest: 'Investment', 
    invest_return: 'Invest Return',
    deposit: 'Deposit', 
    withdraw: 'Withdrawal', 
    transfer_out: 'Transfer Sent', 
    transfer_in: 'Transfer Received' 
  };
  const typeIcons = { 
    deposit: 'deposit', 
    withdraw: 'withdraw', 
    invest: 'invest', 
    invest_return: 'invest',
    transfer_out: 'transfer', 
    transfer_in: 'transfer' 
  };
  const iconEmoji = {
    deposit: '💰',
    withdraw: '💸',
    invest: '📈',
    invest_return: '📈',
    transfer_out: '📤',
    transfer_in: '📥'
  };
  const sign = tx.type === 'withdraw' || tx.type === 'transfer_out' || tx.type === 'invest' ? '-' : '+';
  const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in' || tx.type === 'invest_return';
  const isPending = tx.status === 'pending';

  return `
    <div class="transaction-item">
      <div class="tx-icon ${typeIcons[tx.type] || 'deposit'}">${iconEmoji[tx.type] || '📋'}</div>
      <div class="tx-details">
        <h4>${typeLabels[tx.type] || tx.type}</h4>
        <p>${new Date(tx.date).toLocaleDateString()}</p>
      </div>
      <div class="tx-amount">
        <h4 class="${isPositive ? 'positive' : 'negative'}">${sign}$${tx.amount.toLocaleString()}</h4>
        <span class="tx-status ${isPending ? 'pending' : 'completed'}">${tx.status}</span>
      </div>
    </div>
  `;
}

// ========== HISTORY SECTION ==========
window.filterHistory = function(filter) {
  currentHistoryFilter = filter;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderHistory();
};

function renderHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;

  if (!allTransactions.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No transactions yet</p></div>';
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
    container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No transactions in this category</p></div>';
    return;
  }

  container.innerHTML = filtered.map(formatTransaction).join('');
}

// ========== LOAD PENDING ==========
async function loadPending() {
  const withdrawSnapshot = await get(ref(db, 'users/' + currentUser.uid + '/pendingWithdrawals'));
  const depositSnapshot = await get(ref(db, 'users/' + currentUser.uid + '/pendingDeposits'));

  const withdrawals = withdrawSnapshot.val();
  const deposits = depositSnapshot.val();

  const wContainer = document.getElementById('pendingWithdrawals');
  const dContainer = document.getElementById('pendingDeposits');

  if (!withdrawals) {
    if (wContainer) wContainer.innerHTML = '<h4>No pending withdrawals</h4><p style="color: var(--text-muted); font-size: 0.85rem;">Your withdrawal requests will appear here.</p>';
  } else {
    let html = '<h4>Pending Withdrawals</h4>';
    for (const [id, w] of Object.entries(withdrawals)) {
      if (w.status === 'pending') {
        html += `
          <div class="transaction-item" style="padding-left:0; padding-right:0;">
            <div class="tx-details">
              <h4>Withdrawal</h4>
              <p>${w.network ? w.network.replace('_', ' ') : (w.method || 'N/A')}</p>
            </div>
            <div class="tx-amount">
              <h4 class="negative">-$${w.amount.toLocaleString()}</h4>
              <span class="tx-status pending">${w.status.toUpperCase()}</span>
            </div>
          </div>
        `;
      }
    }
    if (wContainer) wContainer.innerHTML = html;
  }

  if (!deposits) {
    if (dContainer) dContainer.innerHTML = '<h4>No pending deposits</h4><p style="color: var(--text-muted); font-size: 0.85rem;">Your deposit requests will appear here.</p>';
  } else {
    let html = '<h4>Pending Deposits</h4>';
    for (const [id, d] of Object.entries(deposits)) {
      if (d.status === 'pending') {
        html += `
          <div class="transaction-item" style="padding-left:0; padding-right:0;">
            <div class="tx-details">
              <h4>Deposit</h4>
              <p>${d.network ? d.network.replace('_', ' ') : (d.method || 'N/A')}</p>
            </div>
            <div class="tx-amount">
              <h4 class="positive">+$${d.amount.toLocaleString()}</h4>
              <span class="tx-status pending">${d.status.toUpperCase()}</span>
            </div>
          </div>
        `;
      }
    }
    if (dContainer) dContainer.innerHTML = html;
  }
}

// ========== REFERRAL ==========
window.copyReferral = function() {
  const input = document.getElementById('referralLink');
  if (!input) return;
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('Referral link copied!');
};

async function loadReferralStats() {
  const snapshot = await get(ref(db, 'users'));
  const users = snapshot.val();

  let count = 0;

  for (const u of Object.values(users || {})) {
    if (u.referredBy === currentUser.uid) {
      count++;
    }
  }

  const totalRefEl = document.getElementById('totalReferrals');
  const totalEarnedEl = document.getElementById('totalReferralEarned');

  if (totalRefEl) totalRefEl.textContent = count;
  if (totalEarnedEl) totalEarnedEl.textContent = '$' + (userData.referralEarnings || 0).toLocaleString();
}

// ========== LOGOUT ==========
window.logout = function() {
  const overlay = document.getElementById('logoutOverlay');
  if (overlay) overlay.classList.add('show');

  setTimeout(() => {
    sessionStorage.removeItem('apexvault_user');
    window.location.href = 'login.html';
  }, 1500);
};

// ========== KYC ==========
window.showKYC = function() {
  showSection('kyc');
  checkKYCStatus();
};

async function checkKYCStatus() {
  try {
    const snapshot = await get(ref(db, 'users/' + currentUser.uid + '/kyc'));
    const kycData = snapshot.val();

    const formContainer = document.getElementById('kycFormContainer');
    const statusContainer = document.getElementById('kycStatusContainer');
    const approvedContainer = document.getElementById('kycApprovedContainer');
    const rejectedContainer = document.getElementById('kycRejectedContainer');

    if (!kycData) {
      if (formContainer) formContainer.style.display = 'block';
      if (statusContainer) statusContainer.style.display = 'none';
      if (approvedContainer) approvedContainer.style.display = 'none';
      if (rejectedContainer) rejectedContainer.style.display = 'none';
      return;
    }

    if (kycData.status === 'pending') {
      if (formContainer) formContainer.style.display = 'none';
      if (statusContainer) statusContainer.style.display = 'block';
      if (approvedContainer) approvedContainer.style.display = 'none';
      if (rejectedContainer) rejectedContainer.style.display = 'none';
    } else if (kycData.status === 'approved') {
      if (formContainer) formContainer.style.display = 'none';
      if (statusContainer) statusContainer.style.display = 'none';
      if (approvedContainer) approvedContainer.style.display = 'block';
      if (rejectedContainer) rejectedContainer.style.display = 'none';
    } else if (kycData.status === 'rejected') {
      if (formContainer) formContainer.style.display = 'none';
      if (statusContainer) statusContainer.style.display = 'none';
      if (approvedContainer) approvedContainer.style.display = 'none';
      if (rejectedContainer) rejectedContainer.style.display = 'block';
      const reasonEl = document.getElementById('kycRejectionReason');
      if (reasonEl) reasonEl.textContent = 'Reason: ' + (kycData.rejectionReason || 'No reason provided');
    }
  } catch (err) {
    console.error('KYC status error:', err);
  }
}

// ========== FILE UPLOAD ==========
window.handleFileUpload = function(input, previewId, urlId) {
  const file = input.files[0];
  if (!file) return;

  // Validate file size (max 2MB for base64 in DB)
  if (file.size > 2000000) {
    alert('Image is too large. Please choose an image under 2MB.');
    input.value = '';
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = function(e) {
    const previewDiv = document.getElementById(previewId);
    const img = previewDiv.querySelector('img');
    img.src = e.target.result;
    previewDiv.style.display = 'block';

    // Store base64 in hidden input
    document.getElementById(urlId).value = e.target.result;

    // Hide placeholder
    const box = input.closest('.file-upload-box');
    const placeholder = box.querySelector('[id$="Placeholder"]');
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
};

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.submitKYC = async function(event) {
  event.preventDefault();

  const fullName = document.getElementById('kycFullName').value.trim();
  const idNumber = document.getElementById('kycIdNumber').value.trim();
  const dob = document.getElementById('kycDob').value;
  const address = document.getElementById('kycAddress').value.trim();
  const phone = document.getElementById('kycPhone').value.trim();
  const idFrontFile = document.getElementById('kycIdFrontFile').files[0];
  const selfieFile = document.getElementById('kycSelfieFile').files[0];
  const submitBtn = document.getElementById('kycSubmitBtn');

  if (!idFrontFile) { alert('Please upload your ID front photo'); return; }
  if (!selfieFile) { alert('Please upload your selfie with ID'); return; }

  // Check file sizes
  if (idFrontFile.size > 2000000) { alert('ID photo is too large. Max 2MB.'); return; }
  if (selfieFile.size > 2000000) { alert('Selfie is too large. Max 2MB.'); return; }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  // Show progress
  const idFrontProgress = document.getElementById('idFrontProgress');
  const selfieProgress = document.getElementById('selfieProgress');
  const idFrontFill = document.getElementById('idFrontFill');
  const selfieFill = document.getElementById('selfieFill');

  if (idFrontProgress) idFrontProgress.style.display = 'block';
  if (idFrontFill) idFrontFill.style.width = '30%';

  try {
    // Convert ID front to base64
    const idFrontBase64 = await fileToBase64(idFrontFile);
    if (idFrontFill) idFrontFill.style.width = '100%';

    if (selfieProgress) selfieProgress.style.display = 'block';
    if (selfieFill) selfieFill.style.width = '30%';

    // Convert selfie to base64
    const selfieBase64 = await fileToBase64(selfieFile);
    if (selfieFill) selfieFill.style.width = '100%';

    // Save to database (base64 images stored directly)
    await set(ref(db, 'users/' + currentUser.uid + '/kyc'), {
      fullName: fullName,
      idNumber: idNumber,
      dob: dob,
      address: address,
      phone: phone,
      idFront: idFrontBase64,
      selfie: selfieBase64,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      timestamp: Date.now()
    });

    await set(ref(db, 'pendingKYC/' + currentUser.uid), {
      userId: currentUser.uid,
      userName: userData.fullName,
      userEmail: userData.email,
      fullName: fullName,
      idNumber: idNumber,
      dob: dob,
      address: address,
      phone: phone,
      idFront: idFrontBase64,
      selfie: selfieBase64,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      timestamp: Date.now()
    });

    showSuccessAnimation('KYC Submitted', 'Your verification is under review.', 'overview');
    checkKYCStatus();
  } catch (error) {
    console.error('KYC submit error:', error);
    alert('Error: ' + (error.message || 'Failed to submit KYC. Please try again.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit KYC for Review';
    if (idFrontProgress) idFrontProgress.style.display = 'none';
    if (selfieProgress) selfieProgress.style.display = 'none';
  }
};

window.resetKYC = function() {
  const formContainer = document.getElementById('kycFormContainer');
  const statusContainer = document.getElementById('kycStatusContainer');
  const approvedContainer = document.getElementById('kycApprovedContainer');
  const rejectedContainer = document.getElementById('kycRejectedContainer');

  if (formContainer) formContainer.style.display = 'block';
  if (statusContainer) statusContainer.style.display = 'none';
  if (approvedContainer) approvedContainer.style.display = 'none';
  if (rejectedContainer) rejectedContainer.style.display = 'none';

  // Clear form
  document.getElementById('kycFullName').value = '';
  document.getElementById('kycIdNumber').value = '';
  document.getElementById('kycDob').value = '';
  document.getElementById('kycAddress').value = '';
  document.getElementById('kycPhone').value = '';
  document.getElementById('kycIdFrontFile').value = '';
  document.getElementById('kycSelfieFile').value = '';
  document.getElementById('idFrontUrl').value = '';
  document.getElementById('selfieUrl').value = '';

  // Reset previews
  document.getElementById('idFrontPreview').style.display = 'none';
  document.getElementById('idFrontPlaceholder').style.display = 'block';
  document.getElementById('selfiePreview').style.display = 'none';
  document.getElementById('selfiePlaceholder').style.display = 'block';
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkLogin()) return;

  try {
    // Load deposit addresses from Firebase first
    await loadDepositAddresses();
    await loadUserData();
    showSection('overview');
    checkKYCStatus();

  } catch (error) {
    console.error('Dashboard init error:', error);
    alert('Error loading dashboard. Please refresh.');
  } finally {
    setTimeout(() => {
      const loginOverlay = document.getElementById('loginOverlay');
      if (loginOverlay) loginOverlay.classList.add('hidden');
    }, 800);
  }
});
