// ========== APEXVAULT WITHDRAW PAGE LOGIC ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, get, set, push, runTransaction } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

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
const auth = getAuth(app);

// DEMO USER (replace with real auth in production)
const CURRENT_USER = {
  uid: "demo_user_123",
  email: "you@apexvault.com",
  displayName: "You",
  balance: 12450.00,
  pin: "1234"
};

// DAILY LIMIT LOGIC
function getDailyLimit(balance) {
  if (balance >= 50000) return 3000;
  if (balance >= 10000) return 2000;
  if (balance >= 5000) return 1000;
  return 500;
}

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// DOM Elements
const currentBalanceEl = document.getElementById("currentBalance");
const limitAmountEl = document.getElementById("limitAmount");
const limitRemainingEl = document.getElementById("limitRemaining");
const limitBarEl = document.getElementById("limitBar");
const walletDisplayEl = document.getElementById("walletDisplay");
const savedWalletAddressEl = document.getElementById("savedWalletAddress");
const changeWalletBtn = document.getElementById("changeWalletBtn");
const walletFormEl = document.getElementById("walletForm");
const userWalletAddressInput = document.getElementById("userWalletAddress");
const saveWalletBtn = document.getElementById("saveWalletBtn");
const withdrawMethodSelect = document.getElementById("withdrawMethod");
const withdrawAmountInput = document.getElementById("withdrawAmount");
const presetContainer = document.getElementById("presetContainer");
const withdrawSummaryEl = document.getElementById("withdrawSummary");
const summaryAmountEl = document.getElementById("summaryAmount");
const summaryFeeEl = document.getElementById("summaryFee");
const summaryTotalEl = document.getElementById("summaryTotal");
const withdrawBtn = document.getElementById("withdrawBtn");

// Processing fee (2%)
const PROCESSING_FEE_RATE = 0.02;

// State
let dailyUsed = 0;
let dailyLimit = 0;
let savedWalletAddress = "";
let currentAmount = 0;

// ========== PARTICLES ==========
function createParticles() {
  const container = document.getElementById("particlesContainer");
  if (!container) return;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 5 + "s";
    particle.style.animationDuration = (Math.random() * 10 + 10) + "s";
    container.appendChild(particle);
  }
}

// ========== WALLET FUNCTIONS ==========
async function loadWalletAddress() {
  const walletRef = ref(db, `users/${CURRENT_USER.uid}/walletAddress`);
  try {
    const snapshot = await get(walletRef);
    if (snapshot.exists()) {
      savedWalletAddress = snapshot.val();
      showSavedWallet();
    } else {
      showWalletForm();
    }
  } catch (err) {
    console.error("Error loading wallet:", err);
    showWalletForm();
  }
}

function showSavedWallet() {
  walletDisplayEl.style.display = "block";
  walletFormEl.style.display = "none";
  savedWalletAddressEl.textContent = savedWalletAddress;
}

function showWalletForm() {
  walletDisplayEl.style.display = "none";
  walletFormEl.style.display = "block";
  userWalletAddressInput.value = savedWalletAddress;
}

async function saveWalletAddress() {
  const address = userWalletAddressInput.value.trim();
  if (!address) {
    showMessage("Please enter a wallet address", "error");
    return;
  }
  
  try {
    await set(ref(db, `users/${CURRENT_USER.uid}/walletAddress`), address);
    savedWalletAddress = address;
    showSavedWallet();
    showMessage("Wallet address saved successfully", "success");
  } catch (err) {
    console.error("Error saving wallet:", err);
    showMessage("Failed to save wallet address", "error");
  }
}

// ========== BALANCE & LIMIT ==========
async function loadBalanceAndLimit() {
  dailyLimit = getDailyLimit(CURRENT_USER.balance);
  
  if (limitAmountEl) limitAmountEl.textContent = `$${dailyLimit.toFixed(2)}`;
  if (currentBalanceEl) currentBalanceEl.textContent = `$${CURRENT_USER.balance.toFixed(2)}`;
  
  const todayKey = getTodayKey();
  const dailyRef = ref(db, `users/${CURRENT_USER.uid}/dailyWithdrawals/${todayKey}`);
  
  try {
    const snapshot = await get(dailyRef);
    dailyUsed = snapshot.exists() ? snapshot.val() : 0;
    updateLimitDisplay();
  } catch (err) {
    console.error("Error loading daily usage:", err);
    dailyUsed = 0;
    updateLimitDisplay();
  }
}

function updateLimitDisplay() {
  const remaining = Math.max(0, dailyLimit - dailyUsed);
  const percentage = dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0;
  
  if (limitRemainingEl) {
    limitRemainingEl.textContent = `$${remaining.toFixed(2)} remaining today`;
  }
  if (limitBarEl) {
    limitBarEl.style.width = `${Math.min(percentage, 100)}%`;
    limitBarEl.style.background = percentage > 80 ? "#ff6b6b" : "var(--accent)";
  }
}

// ========== AMOUNT HANDLING ==========
function updateSummary() {
  const amount = parseFloat(withdrawAmountInput.value) || 0;
  currentAmount = amount;
  
  if (amount > 0) {
    const fee = amount * PROCESSING_FEE_RATE;
    const total = amount + fee;
    
    summaryAmountEl.textContent = `$${amount.toFixed(2)}`;
    summaryFeeEl.textContent = `$${fee.toFixed(2)}`;
    summaryTotalEl.textContent = `$${total.toFixed(2)}`;
    withdrawSummaryEl.style.display = "block";
    
    // Enable/disable button
    const remaining = dailyLimit - dailyUsed;
    const canWithdraw = amount > 0 && 
                        amount <= CURRENT_USER.balance && 
                        amount <= remaining &&
                        savedWalletAddress &&
                        withdrawMethodSelect.value === "crypto";
    withdrawBtn.disabled = !canWithdraw;
  } else {
    withdrawSummaryEl.style.display = "none";
    withdrawBtn.disabled = true;
  }
}

// Preset buttons
if (presetContainer) {
  presetContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const amount = e.target.dataset.amount;
      withdrawAmountInput.value = amount;
      updateSummary();
    }
  });
}

// Input listeners
if (withdrawAmountInput) {
  withdrawAmountInput.addEventListener("input", updateSummary);
}

if (withdrawMethodSelect) {
  withdrawMethodSelect.addEventListener("change", updateSummary);
}

// ========== WITHDRAWAL ==========
async function processWithdrawal() {
  const amount = parseFloat(withdrawAmountInput.value) || 0;
  const fee = amount * PROCESSING_FEE_RATE;
  const total = amount + fee;
  
  if (amount <= 0) {
    showMessage("Please enter a valid amount", "error");
    return;
  }
  
  if (amount > CURRENT_USER.balance) {
    showMessage("Insufficient balance", "error");
    return;
  }
  
  if ((dailyUsed + amount) > dailyLimit) {
    showMessage("Exceeds daily withdrawal limit", "error");
    return;
  }
  
  if (!savedWalletAddress) {
    showMessage("Please save a wallet address first", "error");
    return;
  }
  
  if (withdrawMethodSelect.value !== "crypto") {
    showMessage("Please select a valid withdrawal method", "error");
    return;
  }
  
  // Disable button
  withdrawBtn.disabled = true;
  withdrawBtn.textContent = "Processing...";
  
  const todayKey = getTodayKey();
  const txRef = push(ref(db, `users/${CURRENT_USER.uid}/transactions`));
  
  const transactionData = {
    type: "withdrawal",
    amount: amount,
    fee: fee,
    totalDeducted: total,
    method: "crypto",
    walletAddress: savedWalletAddress,
    status: "pending",
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  try {
    // Update balance
    await runTransaction(ref(db, `users/${CURRENT_USER.uid}/balance`), (current) => {
      return (current || CURRENT_USER.balance) - total;
    });
    
    // Update daily usage
    await runTransaction(ref(db, `users/${CURRENT_USER.uid}/dailyWithdrawals/${todayKey}`), (current) => {
      return (current || 0) + amount;
    });
    
    // Save transaction
    await set(txRef, transactionData);
    
    // Update local state
    CURRENT_USER.balance -= total;
    dailyUsed += amount;
    
    // Update UI
    currentBalanceEl.textContent = `$${CURRENT_USER.balance.toFixed(2)}`;
    updateLimitDisplay();
    
    // Reset form
    withdrawAmountInput.value = "";
    withdrawSummaryEl.style.display = "none";
    withdrawBtn.textContent = "Request Withdrawal";
    withdrawBtn.disabled = true;
    
    showMessage(`Withdrawal of $${amount.toFixed(2)} submitted! Status: Pending`, "success");
    
  } catch (err) {
    console.error("Withdrawal failed:", err);
    withdrawBtn.textContent = "Request Withdrawal";
    withdrawBtn.disabled = false;
    showMessage("Transaction failed. Please try again.", "error");
  }
}

// ========== MESSAGE DISPLAY ==========
function showMessage(text, type) {
  // Remove existing message
  const existing = document.querySelector(".av-message");
  if (existing) existing.remove();
  
  const msg = document.createElement("div");
  msg.className = `av-message ${type}`;
  msg.textContent = text;
  
  const card = document.querySelector(".av-withdraw-card");
  if (card) {
    card.insertBefore(msg, card.querySelector(".av-balance-display").nextSibling);
  }
  
  setTimeout(() => msg.remove(), 5000);
}

// ========== EVENT LISTENERS ==========
if (saveWalletBtn) {
  saveWalletBtn.addEventListener("click", saveWalletAddress);
}

if (changeWalletBtn) {
  changeWalletBtn.addEventListener("click", showWalletForm);
}

if (withdrawBtn) {
  withdrawBtn.addEventListener("click", (e) => {
    e.preventDefault();
    processWithdrawal();
  });
}

// ========== INIT ==========
async function init() {
  createParticles();
  await loadBalanceAndLimit();
  await loadWalletAddress();
}

document.addEventListener("DOMContentLoaded", init);

// ========== END APEXVAULT WITHDRAW PAGE LOGIC ==========
