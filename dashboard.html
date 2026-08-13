<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ApexVault - Dashboard</title>
  <link rel="stylesheet" href="dashboard.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:1000; opacity:0; pointer-events:none; transition:opacity 0.25s ease; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .modal-overlay.show { opacity:1; pointer-events:auto; }
    .filter-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); color:var(--text-muted); padding:0.4rem 0.9rem; border-radius:20px; font-size:0.8rem; cursor:pointer; white-space:nowrap; }
    .filter-btn.active { background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); color:#fff; border-color:transparent; }

    /* KYC File Upload */
    .file-upload-box {
      background: rgba(255,255,255,0.03);
      border: 2px dashed rgba(100,255,218,0.3);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .file-upload-box:hover {
      border-color: var(--accent);
      background: rgba(100,255,218,0.05);
    }
    .upload-progress {
      margin-top: 8px;
    }
    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
      border-radius: 2px;
      width: 0%;
      transition: width 0.3s ease;
    }
  </style>
<base target="_blank">
<base target="_blank">
</head>
<body>

  <!-- PROFIT TOAST -->
  <div class="profit-toast" id="profitToast">
    <span class="toast-icon">🎉</span>
    <span id="profitToastText">Investment profit claimed!</span>
  </div>

  <!-- SUCCESS ANIMATION OVERLAY -->
  <div class="success-overlay" id="successOverlay">
    <div class="success-checkmark">
      <i class="fas fa-check"></i>
    </div>
    <div class="success-text" id="successText">Registered</div>
    <div class="success-subtext" id="successSubtext">Redirecting...</div>
  </div>

  <div class="login-overlay" id="loginOverlay">
    <div class="login-logo-text">🔥</div>
    <div class="login-brand">ApexVault</div>
    <div class="login-spinner"></div>
    <p>Loading your dashboard...</p>
  </div>

  <div class="logout-overlay hidden" id="logoutOverlay">
    <div class="login-brand">🔥ApexVault</div>
    <p>Logging out...</p>
  </div>

  <!-- ========== MOBILE HEADER ========== -->
  <header class="app-header">
    <button class="menu-btn" onclick="toggleMobileSidebar()">
      <i class="fas fa-bars"></i>
    </button>
    <div class="header-title" id="pageTitle">Dashboard</div>
    <button class="notif-btn" id="notifBtn" onclick="openNotifications()">
  <i class="fas fa-bell"></i>
  <span class="notif-dot"></span>
    </button>
  </header>

  <!-- ========== SIDEBAR DRAWER ========== -->
  <aside class="sidebar-drawer" id="sidebar">
    <div class="drawer-header">
      <div class="drawer-user">
        <div class="user-avatar-large" id="userAvatar">U</div>
        <div>
          <h4 id="userName">User</h4>
          <p id="userEmail">user@email.com</p>
        </div>
      </div>
      <button class="drawer-close" onclick="toggleMobileSidebar()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <nav class="drawer-nav">
      <a class="drawer-link active" onclick="showSection('overview')">
        <i class="fas fa-chart-pie"></i> Overview
      </a>
      <a class="drawer-link" onclick="showSection('invest')">
        <i class="fas fa-rocket"></i> Invest
      </a>
      <a class="drawer-link" onclick="showSection('deposit')">
        <i class="fas fa-wallet"></i> Deposit
      </a>
      <a class="drawer-link" onclick="showSection('withdraw')">
        <i class="fas fa-money-bill-wave"></i> Withdraw
      </a>
      <a class="drawer-link" onclick="showSection('transfer')">
        <i class="fas fa-exchange-alt"></i> Transfer
      </a>
      <a class="drawer-link" onclick="showSection('history')">
        <i class="fas fa-history"></i> History
      </a>
      <a class="drawer-link" onclick="showSection('referral')">
        <i class="fas fa-users"></i> Referral
      </a>
      <a class="drawer-link" onclick="showSection('pending')">
        <i class="fas fa-clock"></i> Pending
      </a>
      <a class="drawer-link" onclick="showKYC()">
        <span style="color:var(--text-light); font-size:0.95rem;">KYC</span>
        <span class="kyc-badge">more info</span>
      </a>
    </nav>
    <div class="drawer-footer">
      <button class="logout-btn" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Log Out
      </button>
    </div>
  </aside>
  <div class="drawer-overlay" id="drawerOverlay" onclick="toggleMobileSidebar()"></div>

  <!-- ========== MAIN APP ========== -->
  <main class="app-main">

    <!-- OVERVIEW SECTION -->
    <div id="overviewSection" class="section-content">

      <!-- BALANCE CARD -->
      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-label">Total Balance</span>
          <button class="eye-btn" onclick="toggleBalance()" id="eyeBtn">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div class="balance-amount" id="balanceWrapper">
          <h1 id="totalBalance">$0.00</h1>
        </div>
        <div class="balance-actions">
          <div class="balance-stat">
            <span class="stat-label">Invested</span>
            <span class="stat-value" id="totalInvested">$0.00</span>
          </div>
          <div class="balance-stat">
            <span class="stat-label">Profit</span>
            <span class="stat-value green" id="totalProfit">$0.00</span>
          </div>
          <div class="balance-stat">
            <span class="stat-label">Referral</span>
            <span class="stat-value orange" id="referralEarnings">$0.00</span>
          </div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="quick-actions">
        <button class="action-pill" onclick="showSection('deposit')">
          <div class="pill-icon deposit"><i class="fas fa-plus"></i></div>
          <span>Deposit</span>
        </button>
        <button class="action-pill" onclick="showSection('withdraw')">
          <div class="pill-icon withdraw"><i class="fas fa-arrow-up"></i></div>
          <span>Withdraw</span>
        </button>
        <button class="action-pill" onclick="showSection('transfer')">
          <div class="pill-icon transfer"><i class="fas fa-exchange-alt"></i></div>
          <span>Transfer</span>
        </button>
        <button class="action-pill" onclick="showSection('invest')">
          <div class="pill-icon invest"><i class="fas fa-rocket"></i></div>
          <span>Invest</span>
        </button>
      </div>

      <!-- ACTIVE INVESTMENT BANNER -->
      <div class="invest-banner" id="investmentStatus" style="display: none;">
        <div class="invest-banner-icon"><i class="fas fa-lock"></i></div>
        <div class="invest-banner-info">
          <h4>Active Investment</h4>
          <p id="lockTimer">Time remaining: calculating...</p>
        </div>
      </div>

      <!-- ACTIVE INVESTMENTS LIST -->
      <div id="activeInvestments" style="margin-bottom:1rem;"></div>

      <!-- RECENT ACTIVITY -->
      <div class="section-block">
        <div class="block-header">
          <h3>Recent Activity</h3>
          <a onclick="showSection('history')">See All</a>
        </div>
        <div class="activity-list" id="recentTransactions">
          <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <p>No activity yet</p>
          </div>
        </div>
      </div>

    </div>
    <!-- END OVERVIEW SECTION -->

    <!-- INVEST SECTION -->
    <div id="investSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Investment Plans</h3></div>
        <div id="plansGrid" style="display:grid; gap:1rem; margin-top:1rem;">
          <div class="balance-card" style="cursor:pointer;" onclick="openInvestModal('startup', 100, 999, 10)">
           <h4>Startup Plan</h4>
            <p>Min: $100 | Max: $999</p>
             <p style="color:var(--accent);">10% Profit | 24h Lock</p>
         </div>
            <div class="balance-card" style="cursor:pointer;" onclick="openInvestModal('pro', 1000, 4999, 20)">
            <h4>Pro Plan</h4>
             <p>Min: $1,000 | Max: $4,999</p>
             <p style="color:var(--accent);">20% Profit | 48h Lock</p>
            </div>
          <div class="balance-card" style="cursor:pointer;" onclick="openInvestModal('ultimate', 5000, 999999, 40)">
           <h4>Ultimate Plan</h4>
          <p>Min: $5,000 | Unlimited Max</p>
           <p style="color:var(--accent);">40% Profit | 72h Lock</p>
          </div>     
        </div>
      </div>
    </div>

    <!-- DEPOSIT SECTION -->
    <div id="depositSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Deposit Funds</h3></div>
        <div style="text-align:center; padding:2rem 0;">
          <p style="color:var(--text-muted); margin-bottom:1.5rem;">Add funds to your wallet via crypto.</p>
          <button class="action-pill" style="display:inline-flex;" onclick="openDepositModal()">
            <div class="pill-icon deposit"><i class="fas fa-plus"></i></div>
            <span>New Deposit</span>
          </button>
        </div>
      </div>
    </div>

    <!-- WITHDRAW SECTION -->
    <div id="withdrawSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Withdraw Funds</h3></div>
        <div style="padding:1rem;">
          <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; margin-bottom:1rem;">
            <p style="font-size:0.85rem; color:var(--text-muted);">Daily Limit</p>
            <p id="dailyLimitAmount" style="font-weight:600;">$0.00 / $10,000.00</p>
            <div style="background:rgba(255,255,255,0.05); border-radius:6px; height:6px; margin-top:0.5rem; overflow:hidden;">
              <div id="dailyLimitFill" style="width:0%; height:100%; background:linear-gradient(90deg, var(--gradient-start), var(--gradient-end)); border-radius:6px;"></div>
            </div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">Remaining: <span id="withdrawRemaining">$10,000.00</span></p>
          </div>
          <div style="text-align:center; padding:1rem 0;">
            <button class="action-pill" style="display:inline-flex;" onclick="openWithdrawModal()">
              <div class="pill-icon withdraw"><i class="fas fa-arrow-up"></i></div>
              <span>Request Withdrawal</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TRANSFER SECTION -->
    <div id="transferSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Transfer Funds</h3></div>
        <div style="text-align:center; padding:2rem 0;">
          <p style="color:var(--text-muted); margin-bottom:1.5rem;">Send funds to another ApexVault user.</p>
          <button class="action-pill" style="display:inline-flex;" onclick="openTransferModal()">
            <div class="pill-icon transfer"><i class="fas fa-exchange-alt"></i></div>
            <span>New Transfer</span>
          </button>
        </div>
      </div>
    </div>

    <!-- HISTORY SECTION -->
    <div id="historySection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Transaction History</h3></div>
        <div style="display:flex; gap:0.5rem; margin-bottom:1rem; overflow-x:auto;">
          <button class="filter-btn active" data-filter="all" onclick="filterHistory('all')">All</button>
          <button class="filter-btn" data-filter="deposit" onclick="filterHistory('deposit')">Deposit</button>
          <button class="filter-btn" data-filter="withdraw" onclick="filterHistory('withdraw')">Withdraw</button>
          <button class="filter-btn" data-filter="invest" onclick="filterHistory('invest')">Invest</button>
          <button class="filter-btn" data-filter="transfer" onclick="filterHistory('transfer')">Transfer</button>
        </div>
        <div id="historyList">
          <div class="empty-state"><i class="fas fa-receipt"></i><p>No transactions yet</p></div>
        </div>
      </div>
    </div>

    <!-- REFERRAL SECTION -->
    <div id="referralSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Referral Program</h3></div>
        <div style="padding:1rem;">
          <div class="balance-card" style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
              <span style="color:var(--text-muted);">Total Referrals</span>
              <span id="totalReferrals" style="font-weight:700;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-muted);">Total Earned</span>
              <span id="totalReferralEarned" style="font-weight:700; color:var(--accent);">$0.00</span>
            </div>
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.75rem;">Share your link:</p>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="referralLink" readonly style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.6rem 0.8rem; color:var(--text); font-size:0.85rem;">
            <button onclick="copyReferral()" style="background:var(--accent); border:none; border-radius:8px; padding:0 1rem; color:#fff; cursor:pointer;"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- PENDING SECTION -->
    <div id="pendingSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Pending Requests</h3></div>
        <div id="pendingWithdrawals" style="margin-bottom:1.5rem;">
          <h4 style="margin-bottom:0.5rem;">No pending withdrawals</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Your withdrawal requests will appear here.</p>
        </div>
        <div id="pendingDeposits">
          <h4 style="margin-bottom:0.5rem;">No pending deposits</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Your deposit requests will appear here.</p>
        </div>
      </div>
    </div>

    <!-- KYC SECTION -->
    <div id="kycSection" class="section-content" style="display:none;">
      <div class="section-block">
        <div class="block-header"><h3>Identity Verification</h3></div>
        <div id="kycFormContainer">
          <form onsubmit="submitKYC(event)" style="padding:1rem 0;">
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Full Name (as on ID)</label>
              <input type="text" id="kycFullName" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
            </div>
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">ID Number / Passport</label>
              <input type="text" id="kycIdNumber" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
            </div>
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Date of Birth</label>
              <input type="date" id="kycDob" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
            </div>
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Address</label>
              <input type="text" id="kycAddress" required placeholder="Street, City, Country" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
            </div>
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Phone Number</label>
              <input type="tel" id="kycPhone" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
            </div>

            <!-- ID FRONT UPLOAD -->
            <div style="margin-bottom:1.5rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">ID Document Front Photo</label>
              <div class="file-upload-box" id="idFrontBox" onclick="document.getElementById('kycIdFrontFile').click()">
                <input type="file" id="kycIdFrontFile" accept="image/*" style="display:none;" onchange="handleFileUpload(this, 'idFrontPreview', 'idFrontUrl')">
                <div id="idFrontPreview" style="display:none; width:100%; text-align:center;">
                  <img id="idFrontImg" style="max-width:100%; max-height:200px; border-radius:10px; margin-bottom:8px;">
                  <p style="color:var(--success); font-size:0.8rem;"><i class="fas fa-check"></i> Ready to upload</p>
                </div>
                <div id="idFrontPlaceholder" style="text-align:center; padding:2rem;">
                  <i class="fas fa-cloud-upload-alt" style="font-size:2rem; color:var(--accent); margin-bottom:8px;"></i>
                  <p style="color:var(--text-muted); font-size:0.85rem;">Tap to upload ID front photo</p>
                  <p style="color:var(--text-muted); font-size:0.7rem; margin-top:4px;">JPG, PNG, WEBP accepted</p>
                </div>
              </div>
              <input type="hidden" id="idFrontUrl">
              <div class="upload-progress" id="idFrontProgress" style="display:none;">
                <div class="progress-bar"><div class="progress-fill" id="idFrontFill"></div></div>
                <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:4px;">Uploading...</p>
              </div>
            </div>

            <!-- SELFIE UPLOAD -->
            <div style="margin-bottom:1.5rem;">
              <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Selfie with ID Photo</label>
              <div class="file-upload-box" id="selfieBox" onclick="document.getElementById('kycSelfieFile').click()">
                <input type="file" id="kycSelfieFile" accept="image/*" style="display:none;" onchange="handleFileUpload(this, 'selfiePreview', 'selfieUrl')">
                <div id="selfiePreview" style="display:none; width:100%; text-align:center;">
                  <img id="selfieImg" style="max-width:100%; max-height:200px; border-radius:10px; margin-bottom:8px;">
                  <p style="color:var(--success); font-size:0.8rem;"><i class="fas fa-check"></i> Ready to upload</p>
                </div>
                <div id="selfiePlaceholder" style="text-align:center; padding:2rem;">
                  <i class="fas fa-camera" style="font-size:2rem; color:var(--accent); margin-bottom:8px;"></i>
                  <p style="color:var(--text-muted); font-size:0.85rem;">Tap to upload selfie with ID</p>
                  <p style="color:var(--text-muted); font-size:0.7rem; margin-top:4px;">JPG, PNG, WEBP accepted</p>
                </div>
              </div>
              <input type="hidden" id="selfieUrl">
              <div class="upload-progress" id="selfieProgress" style="display:none;">
                <div class="progress-bar"><div class="progress-fill" id="selfieFill"></div></div>
                <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:4px;">Uploading...</p>
              </div>
            </div>

            <button type="submit" id="kycSubmitBtn" style="width:100%; background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border:none; border-radius:12px; padding:0.9rem; color:#fff; font-weight:600; cursor:pointer;">Submit KYC for Review</button>
          </form>
        </div>
        <div id="kycStatusContainer" style="display:none; text-align:center; padding:2rem 1rem;">
          <div style="width:70px; height:70px; border-radius:50%; background:rgba(100,255,218,0.1); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
            <i class="fas fa-clock" style="font-size:1.8rem; color:var(--accent);"></i>
          </div>
          <h3 style="color:var(--text-white); margin-bottom:0.5rem;">KYC Under Review</h3>
          <p style="color:var(--text-muted); font-size:0.9rem;">Your identity verification is being reviewed by our team. You will be notified once approved.</p>
        </div>
        <div id="kycApprovedContainer" style="display:none; text-align:center; padding:2rem 1rem;">
          <div style="width:70px; height:70px; border-radius:50%; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
            <i class="fas fa-check" style="font-size:1.8rem; color:var(--success);"></i>
          </div>
          <h3 style="color:var(--text-white); margin-bottom:0.5rem;">KYC Verified</h3>
          <p style="color:var(--text-muted); font-size:0.9rem;">Your identity has been verified. You have full access to all features.</p>
        </div>
        <div id="kycRejectedContainer" style="display:none; text-align:center; padding:2rem 1rem;">
          <div style="width:70px; height:70px; border-radius:50%; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
            <i class="fas fa-times" style="font-size:1.8rem; color:var(--danger);"></i>
          </div>
          <h3 style="color:var(--text-white); margin-bottom:0.5rem;">KYC Rejected</h3>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1rem;">Your submission was rejected. Please review and resubmit.</p>
          <p id="kycRejectionReason" style="color:var(--danger); font-size:0.85rem; margin-bottom:1rem;"></p>
          <button onclick="resetKYC()" style="background:var(--accent); border:none; border-radius:10px; padding:0.7rem 1.5rem; color:var(--bg-deep); font-weight:600; cursor:pointer;">Resubmit KYC</button>
        </div>
      </div>
    </div>

  </main>

  <!-- ========== BOTTOM NAVIGATION ========== -->
  <nav class="bottom-nav">
    <button class="nav-tab active" onclick="showSection('overview'); setActiveTab(this)">
      <i class="fas fa-home"></i>
      <span>Home</span>
    </button>
    <button class="nav-tab" onclick="showSection('history'); setActiveTab(this)">
      <i class="fas fa-history"></i>
      <span>History</span>
    </button>
    <div class="nav-fab" onclick="showSection('deposit')">
      <i class="fas fa-plus"></i>
    </div>
    <button class="nav-tab" onclick="showSection('invest'); setActiveTab(this)">
      <i class="fas fa-rocket"></i>
      <span>Invest</span>
    </button>
    <button class="nav-tab" onclick="showSection('referral'); setActiveTab(this)">
      <i class="fas fa-gift"></i>
      <span>Earn</span>
    </button>
  </nav>

  <!-- ========== FLOATING CONTACTS ========== -->
  <div class="floating-contacts">
    <a href="mailto:support@apexvault.com" class="float-btn email-btn" title="Email Us">
      <i class="fas fa-envelope"></i>
    </a>
    <a href="https://wa.me/447393659737" target="_blank" class="float-btn whatsapp-btn glow-pulse" title="WhatsApp">
      <i class="fab fa-whatsapp"></i>
    </a>
  </div>

  <!-- ========== MODALS ========== -->

  <!-- Invest Modal -->
  <div class="modal-overlay" id="investModal">
    <div class="modal-content" style="background:var(--card-bg); border-radius:16px; padding:1.5rem; max-width:400px; width:90%; margin:auto; position:relative; top:50%; transform:translateY(-50%); border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 id="investModalTitle">Invest</h3>
        <button onclick="closeModal('investModal')" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <p id="investModalDesc" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">Plan details</p>
      <form onsubmit="submitInvest(event)">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Amount (USD)</label>
        <input type="number" id="investAmount" step="0.01" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Expected Profit</label>
        <input type="text" id="expectedProfit" readonly style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--accent); margin-bottom:1rem;">
        <button type="submit" style="width:100%; background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border:none; border-radius:12px; padding:0.9rem; color:#fff; font-weight:600; cursor:pointer;">Confirm Investment</button>
      </form>
    </div>
  </div>

  <!-- Deposit Modal -->
  <div class="modal-overlay" id="depositModal">
    <div class="modal-content" style="background:var(--card-bg); border-radius:16px; padding:1.5rem; max-width:400px; width:90%; margin:auto; position:relative; top:50%; transform:translateY(-50%); border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3>Deposit</h3>
        <button onclick="closeModal('depositModal')" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="submitDeposit(event)">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Amount (USD)</label>
        <input type="number" id="depositAmount" step="0.01" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Network</label>
        <select id="depositNetwork" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
          <option value="">Select network</option>
          <option value="USDT_BEP20">USDT BEP20</option>
          <option value="USDT_TRC20">USDT TRC20</option>
        </select>
        <div id="depositAddressGroup" style="display:none; margin-bottom:1rem;">
          <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Deposit Address</label>
          <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem;">
            <input type="text" id="depositAddress" readonly style="flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); font-size:0.85rem;">
            <button type="button" onclick="copyDepositAddress()" style="background:var(--accent); border:none; border-radius:10px; padding:0 0.8rem; color:#fff; cursor:pointer;"><i class="fas fa-copy"></i></button>
          </div>
          <p id="addressHint" style="font-size:0.75rem; color:var(--text-muted);"></p>
        </div>
        <button type="submit" style="width:100%; background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border:none; border-radius:12px; padding:0.9rem; color:#fff; font-weight:600; cursor:pointer;">Submit Deposit Request</button>
      </form>
    </div>
  </div>

  <!-- Withdraw Modal -->
  <div class="modal-overlay" id="withdrawModal">
    <div class="modal-content" style="background:var(--card-bg); border-radius:16px; padding:1.5rem; max-width:400px; width:90%; margin:auto; position:relative; top:50%; transform:translateY(-50%); border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3>Withdraw</h3>
        <button onclick="closeModal('withdrawModal')" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="submitWithdraw(event)">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Amount (USD)</label>
        <input type="number" id="withdrawAmount" step="0.01" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Network</label>
        <select id="withdrawNetwork" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
          <option value="">Select network</option>
          <option value="USDT_BEP20">USDT BEP20</option>
          <option value="USDT_TRC20">USDT TRC20</option>
        </select>
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Wallet Address</label>
        <input type="text" id="withdrawWalletAddress" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
        <button type="submit" style="width:100%; background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border:none; border-radius:12px; padding:0.9rem; color:#fff; font-weight:600; cursor:pointer;">Request Withdrawal</button>
      </form>
    </div>
  </div>

  <!-- Transfer Modal -->
  <div class="modal-overlay" id="transferModal">
    <div class="modal-content" style="background:var(--card-bg); border-radius:16px; padding:1.5rem; max-width:400px; width:90%; margin:auto; position:relative; top:50%; transform:translateY(-50%); border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3>Transfer</h3>
        <button onclick="closeModal('transferModal')" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="submitTransfer(event)">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Recipient Email</label>
        <input type="email" id="transferEmail" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:0.75rem;">
        <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.4rem;">Amount (USD)</label>
        <input type="number" id="transferAmount" step="0.01" required style="width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.7rem; color:var(--text); margin-bottom:1rem;">
        <button type="submit" style="width:100%; background:linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border:none; border-radius:12px; padding:0.9rem; color:#fff; font-weight:600; cursor:pointer;">Send Transfer</button>
      </form>
    </div>
  </div>

  <!-- ========== TAB HELPER ========== -->
  <script>
    window.setActiveTab = function(el) {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      if (el) el.classList.add('active');
    };
    window.toggleBalance = function() {
      const bal = document.getElementById('totalBalance');
      const btn = document.getElementById('eyeBtn');
      const wrap = document.getElementById('balanceWrapper');
      if (wrap.classList.contains('blurred')) {
        wrap.classList.remove('blurred');
        btn.innerHTML = '<i class="fas fa-eye"></i>';
      } else {
        wrap.classList.add('blurred');
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      }
    };
  </script>

  <!-- Firebase SDK -->
  <script type="module" src="dashboard.js"></script>
  <script src="translator.js"></script>
  <!-- TRANSFER COIN ANIMATION -->
  <div class="transfer-coin" id="transferCoin">$</div>
</body>
</html>
