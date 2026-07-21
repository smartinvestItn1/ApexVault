// ========== APEXVAULT TRANSFER PAGE LOGIC ==========

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

// DEMO MODE: Replace with real auth in production
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

// STATE
let recipientUser = null;
let currentBalance = CURRENT_USER.balance;
let dailyLimit = getDailyLimit(currentBalance);
let sentToday = 0;
let pinEntered = "";
let pendingTransferData = null;

// DOM ELEMENTS
const emailInput = document.getElementById("recipientEmail");
const amountInput = document.getElementById("transferAmount");
const noteInput = document.getElementById("transferNote");
const userResultDiv = document.getElementById("userResult");
const sendBtn = document.getElementById("sendBtn");
const summaryDiv = document.getElementById("transferSummary");
const summaryAmount = document.getElementById("summaryAmount");
const summaryTotal = document.getElementById("summaryTotal");
const balanceDisplay = document.getElementById("currentBalance");
const presetBtns = document.querySelectorAll(".av-amount-presets button");
const limitAmountEl = document.getElementById("limitAmount");
const limitRemainingEl = document.getElementById("limitRemaining");
const limitBar = document.getElementById("limitBar");

// INIT
balanceDisplay.textContent = formatCurrency(currentBalance);
updateLimitDisplay();
updatePresetButtons();

// HELPERS
function formatCurrency(num) {
  return "$" + parseFloat(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateLimitDisplay() {
  dailyLimit = getDailyLimit(currentBalance);
  const remaining = Math.max(0, dailyLimit - sentToday);
  const pct = dailyLimit > 0 ? (sentToday / dailyLimit) * 100 : 0;

  limitAmountEl.textContent = formatCurrency(dailyLimit);
  limitRemainingEl.textContent = formatCurrency(remaining) + " remaining today";
  limitBar.style.width = Math.min(pct, 100) + "%";

  if (remaining <= 0) {
    limitRemainingEl.className = "limit-remaining exhausted";
    limitBar.style.background = "var(--danger)";
  } else if (remaining < dailyLimit * 0.2) {
    limitRemainingEl.className = "limit-remaining low";
    limitBar.style.background = "var(--warning)";
  } else {
    limitRemainingEl.className = "limit-remaining";
    limitBar.style.background = "var(--accent)";
  }

  updatePresetButtons();
  updateSendButton();
}

function updatePresetButtons() {
  const remaining = dailyLimit - sentToday;
  presetBtns.forEach(btn => {
    const amt = parseFloat(btn.dataset.amount);
    btn.disabled = amt > remaining;
  });
}

function showToast(message, type) {
  type = type || "success";
  const existing = document.querySelector(".av-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "av-toast " + type;
  const icons = { success: "\u2713", error: "\u2715", warning: "!" };
  toast.innerHTML = '<span class="toast-icon">' + icons[type] + '</span><span>' + message + "</span>";
  document.body.appendChild(toast);

  setTimeout(function() {
    toast.style.animation = "slideInRight 0.4s ease reverse";
    setTimeout(function() { toast.remove(); }, 400);
  }, 4000);
}

function showSuccessModal(amount, recipientName, recipientEmail) {
  const overlay = document.createElement("div");
  overlay.className = "av-modal-overlay";
  overlay.innerHTML =
    '<div class="av-modal">' +
      '<div class="modal-icon">\u2713</div>' +
      "<h2>Transfer Successful!</h2>" +
      "<p>Your money has been sent successfully to " + recipientName + ".</p>" +
      '<div class="modal-details">' +
        '<div class="detail-row"><span class="d-label">Amount Sent</span><span class="d-value">' + formatCurrency(amount) + "</span></div>" +
        '<div class="detail-row"><span class="d-label">To</span><span class="d-value">' + recipientEmail + "</span></div>" +
        '<div class="detail-row"><span class="d-label">New Balance</span><span class="d-value">' + formatCurrency(currentBalance) + "</span></div>" +
        '<div class="detail-row"><span class="d-label">Daily Remaining</span><span class="d-value">' + formatCurrency(Math.max(0, dailyLimit - sentToday)) + "</span></div>" +
      "</div>" +
      '<button class="av-modal-btn" onclick="this.closest(\'.av-modal-overlay\').remove()">Done</button>' +
    "</div>";
  document.body.appendChild(overlay);
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) overlay.remove();
  });
}

// PIN MODAL
function showPinModal(onSuccess, onCancel) {
  pinEntered = "";
  const overlay = document.createElement("div");
  overlay.className = "av-pin-overlay";
  overlay.innerHTML =
    '<div class="av-pin-modal">' +
      '<div class="pin-icon">\uD83D\uDD12</div>' +
      "<h2>Enter Transfer PIN</h2>" +
      "<p>Confirm your identity to complete this transfer</p>" +
      '<div class="av-pin-dots" id="pinDots">' +
        '<div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>' +
      "</div>" +
      '<div class="pin-error-msg" id="pinError"></div>' +
      '<div class="av-pin-pad">' +
        '<button data-key="1">1</button><button data-key="2">2</button><button data-key="3">3</button>' +
        '<button data-key="4">4</button><button data-key="5">5</button><button data-key="6">6</button>' +
        '<button data-key="7">7</button><button data-key="8">8</button><button data-key="9">9</button>' +
        '<button class="empty"></button><button data-key="0">0</button><button class="del" data-key="del">\u232B</button>' +
      "</div>" +
      '<button class="pin-cancel" id="pinCancel">Cancel</button>' +
    "</div>";
  document.body.appendChild(overlay);

  const dots = overlay.querySelectorAll(".dot");
  const errorEl = document.getElementById("pinError");

  function updateDots() {
    dots.forEach(function(dot, i) {
      dot.classList.toggle("filled", i < pinEntered.length);
      dot.classList.remove("error");
    });
    errorEl.textContent = "";
  }

  function shakeDots() {
    dots.forEach(function(dot) { dot.classList.add("error"); });
    setTimeout(function() {
      dots.forEach(function(dot) { dot.classList.remove("error"); });
    }, 500);
  }

  function handleKey(key) {
    if (key === "del") {
      pinEntered = pinEntered.slice(0, -1);
      updateDots();
      return;
    }
    if (pinEntered.length < 4) {
      pinEntered += key;
      updateDots();
      if (pinEntered.length === 4) {
        setTimeout(function() {
          if (pinEntered === CURRENT_USER.pin) {
            overlay.remove();
            onSuccess();
          } else {
            shakeDots();
            errorEl.textContent = "Incorrect PIN. Please try again.";
            pinEntered = "";
            updateDots();
          }
        }, 200);
      }
    }
  }

  overlay.querySelectorAll(".av-pin-pad button[data-key]").forEach(function(btn) {
    btn.addEventListener("click", function() { handleKey(btn.dataset.key); });
  });

  document.getElementById("pinCancel").addEventListener("click", function() {
    overlay.remove();
    if (onCancel) onCancel();
  });

  const keyHandler = function(e) {
    if (e.key >= "0" && e.key <= "9") handleKey(e.key);
    if (e.key === "Backspace") handleKey("del");
    if (e.key === "Escape") {
      overlay.remove();
      if (onCancel) onCancel();
    }
  };
  document.addEventListener("keydown", keyHandler);
  overlay.addEventListener("remove", function() {
    document.removeEventListener("keydown", keyHandler);
  });
}

// EMAIL LOOKUP
let debounceTimer;
emailInput.addEventListener("input", function(e) {
  const email = e.target.value.trim().toLowerCase();
  recipientUser = null;
  userResultDiv.innerHTML = "";
  updateSendButton();

  clearTimeout(debounceTimer);
  if (!email || !email.includes("@")) return;

  debounceTimer = setTimeout(async function() {
    try {
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        showNotFound();
        return;
      }

      const users = snapshot.val();
      let foundUser = null;

      for (const uid in users) {
        if (users[uid].email && users[uid].email.toLowerCase() === email) {
          if (uid === CURRENT_USER.uid) {
            showSelfError();
            return;
          }
          foundUser = { uid: uid, ...users[uid] };
          break;
        }
      }

      if (foundUser) {
        recipientUser = foundUser;
        showUserFound(foundUser);
      } else {
        showNotFound();
      }
    } catch (err) {
      console.error("Lookup error:", err);
      showToast("Error looking up user. Please try again.", "error");
    }
  }, 500);
});

function showUserFound(user) {
  const initials = user.displayName
    ? user.displayName.split(" ").map(function(n) { return n[0]; }).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();
  userResultDiv.innerHTML =
    '<div class="av-user-found">' +
      '<div class="avatar">' + initials + "</div>" +
      '<div class="info">' +
        '<div class="name">' + (user.displayName || "ApexVault User") + "</div>" +
        '<div class="email">' + user.email + "</div>" +
      "</div>" +
      '<span class="badge">Verified</span>' +
    "</div>";
  updateSendButton();
}

function showNotFound() {
  userResultDiv.innerHTML =
    '<div class="av-user-not-found">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      " No user found with this email address" +
    "</div>";
}

function showSelfError() {
  userResultDiv.innerHTML =
    '<div class="av-user-not-found">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      " You cannot send money to yourself" +
    "</div>";
}

// AMOUNT HANDLING
amountInput.addEventListener("input", updateSummary);

presetBtns.forEach(function(btn) {
  btn.addEventListener("click", function() {
    if (btn.disabled) return;
    presetBtns.forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    amountInput.value = btn.dataset.amount;
    updateSummary();
  });
});

function updateSummary() {
  const amount = parseFloat(amountInput.value);
  const remaining = dailyLimit - sentToday;

  if (amount > 0) {
    summaryDiv.style.display = "block";
    summaryAmount.textContent = formatCurrency(amount);
    summaryTotal.textContent = formatCurrency(amount);

    if (amount > remaining) {
      summaryAmount.style.color = "var(--danger)";
      showToast("Exceeds daily limit. Max: " + formatCurrency(remaining), "warning");
    } else {
      summaryAmount.style.color = "var(--text-white)";
    }
  } else {
    summaryDiv.style.display = "none";
  }
  updateSendButton();
}

function updateSendButton() {
  const amount = parseFloat(amountInput.value);
  const remaining = dailyLimit - sentToday;
  const valid = recipientUser && amount > 0 && amount <= currentBalance && amount <= remaining;
  sendBtn.disabled = !valid;
}

// TRANSFER SUBMISSION
sendBtn.addEventListener("click", async function() {
  const amount = parseFloat(amountInput.value);
  const note = noteInput.value.trim();
  const remaining = dailyLimit - sentToday;

  if (!recipientUser || amount <= 0) return;
  if (amount > currentBalance) {
    showToast("Insufficient balance", "error");
    return;
  }
  if (amount > remaining) {
    showToast("Daily limit exceeded. Remaining: " + formatCurrency(remaining), "error");
    return;
  }

  pendingTransferData = { amount: amount, note: note };
  showPinModal(
    function() { executeTransfer(pendingTransferData.amount, pendingTransferData.note); },
    function() { pendingTransferData = null; }
  );
});

async function executeTransfer(amount, note) {
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="spinner"></span> Processing...';

  try {
    const timestamp = Date.now();
    const transactionId = "tx_" + timestamp + "_" + Math.random().toString(36).substr(2, 9);
    const todayKey = getTodayKey();

    const transactionData = {
      id: transactionId,
      senderId: CURRENT_USER.uid,
      senderEmail: CURRENT_USER.email,
      senderName: CURRENT_USER.displayName,
      recipientId: recipientUser.uid,
      recipientEmail: recipientUser.email,
      recipientName: recipientUser.displayName || "ApexVault User",
      amount: amount,
      note: note || null,
      status: "completed",
      type: "transfer",
      createdAt: timestamp
    };

    const senderBalanceRef = ref(db, "users/" + CURRENT_USER.uid + "/balance");
    await runTransaction(senderBalanceRef, function(current) {
      if (current === null) return currentBalance - amount;
      return current - amount;
    });

    const recipientBalanceRef = ref(db, "users/" + recipientUser.uid + "/balance");
    await runTransaction(recipientBalanceRef, function(current) {
      if (current === null) return amount;
      return current + amount;
    });

    const dailyRef = ref(db, "users/" + CURRENT_USER.uid + "/dailyTransfers/" + todayKey);
    await runTransaction(dailyRef, function(current) {
      return (current || 0) + amount;
    });

    const senderTxRef = push(ref(db, "users/" + CURRENT_USER.uid + "/transactions"));
    await set(senderTxRef, Object.assign({}, transactionData, { direction: "sent" }));

    const recipientTxRef = push(ref(db, "users/" + recipientUser.uid + "/transactions"));
    await set(recipientTxRef, Object.assign({}, transactionData, { direction: "received" }));

    const globalTxRef = push(ref(db, "transactions"));
    await set(globalTxRef, transactionData);

    currentBalance -= amount;
    sentToday += amount;
    balanceDisplay.textContent = formatCurrency(currentBalance);

    emailInput.value = "";
    amountInput.value = "";
    noteInput.value = "";
    userResultDiv.innerHTML = "";
    summaryDiv.style.display = "none";
    presetBtns.forEach(function(b) { b.classList.remove("active"); });
    recipientUser = null;
    pendingTransferData = null;

    updateLimitDisplay();
    showSuccessModal(amount, recipientUser ? recipientUser.displayName || "User" : "User", recipientUser ? recipientUser.email || "" : "");
    showToast("Successfully sent " + formatCurrency(amount) + "!", "success");

  } catch (err) {
    console.error("Transfer error:", err);
    showToast("Transfer failed. Please try again.", "error");
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = "Send Money";
    updateSendButton();
  }
}

// LOAD DAILY SPENT FROM DATABASE
async function loadDailySpent() {
  try {
    const todayKey = getTodayKey();
    const dailyRef = ref(db, "users/" + CURRENT_USER.uid + "/dailyTransfers/" + todayKey);
    const snap = await get(dailyRef);
    if (snap.exists()) {
      sentToday = snap.val();
    }
    updateLimitDisplay();
  } catch (e) {
    console.error("Error loading daily spent:", e);
  }
}

loadDailySpent();

// PRODUCTION AUTH (uncomment to use real Firebase Auth)
/*
onAuthStateChanged(auth, async function(user) {
  if (user) {
    CURRENT_USER.uid = user.uid;
    CURRENT_USER.email = user.email;
    CURRENT_USER.displayName = user.displayName || user.email;

    const userRef = ref(db, "users/" + user.uid);
    const snap = await get(userRef);
    if (snap.exists()) {
      const data = snap.val();
      currentBalance = data.balance || 0;
      CURRENT_USER.pin = data.pin;
      balanceDisplay.textContent = formatCurrency(currentBalance);
      await loadDailySpent();
    }
  } else {
    window.location.href = "/login";
  }
});
*/
  
