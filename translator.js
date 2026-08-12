// ========== APEXVAULT UNIVERSAL TRANSLATOR ==========
// Supports 60+ languages via Google Translate
// Persists across all pages via localStorage

(function() {
  'use strict';

  const STORAGE_KEY = 'apexvault_lang';

  const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇮🇶' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norsk', flag: '🇳🇴' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'bg', name: 'Български', flag: '🇧🇬' },
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
    { code: 'sr', name: 'Српски', flag: '🇷🇸' },
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
    { code: 'et', name: 'Eesti', flag: '🇪🇪' },
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
    { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
    { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
    { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
    { code: 'lo', name: 'ລາວ', flag: '🇱🇦' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
    { code: 'mk', name: 'Македонски', flag: '🇲🇰' },
    { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
    { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
    { code: 'uz', name: 'O'zbek', flag: '🇺🇿' },
    { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
    { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' }
  ];

  let googleTranslateLoaded = false;
  let translateInstance = null;

  // ========== INJECT HIDDEN GOOGLE TRANSLATE ELEMENT ==========
  function injectGoogleElement() {
    if (document.getElementById('google_translate_element')) return;
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:0;height:0;overflow:hidden;';
    document.body.appendChild(div);
  }

  // ========== INJECT STYLES TO HIDE GOOGLE UI ==========
  function injectStyles() {
    if (document.getElementById('apexvault-translate-styles')) return;
    const style = document.createElement('style');
    style.id = 'apexvault-translate-styles';
    style.textContent = `
      .goog-te-banner-frame, .goog-te-menu-value, .goog-te-gadget,
      .goog-te-gadget-simple, #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover,
      .goog-text-highlight, .skiptranslate iframe, .goog-logo-link,
      .goog-te-combo, .goog-te-balloon-frame, #goog-gt-,
      .goog-te-menu-frame, .goog-te-menu2, .goog-te-menu2-item,
      .goog-te-menu2-item-selected, .goog-te-menu2-item-hover,
      .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-l4eHX-hSRGPd,
      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-aZ2wEe-OqVKwc,
      .VIpgJd-yAWNEb-L7lbkb, .VIpgJd-yAWNEb-L7lbkb-ihhZMc,
      .VIpgJd-ZVi9od-xl07Ob-lTBxed, .VIpgJd-ZVi9od-SmfZ-OEVmcd,
      .VIpgJd-ZVi9od-ORHb, .VIpgJd-ZVi9od-SmfZ, .VIpgJd-ZVi9od-xl07Ob,
      .VIpgJd-ZVi9od-vH1Gmf, .VIpgJd-ZVi9od-l4eHX-hSRGPd {
        display: none !important;
      }
      body { top: 0 !important; }
      .translated-ltr body { top: 0 !important; }
      .translated-rtl body { top: 0 !important; }
      .goog-te-gadget { display: none !important; }
      .goog-te-gadget-simple { display: none !important; }
      iframe.goog-te-banner-frame { display: none !important; }
      .goog-te-balloon-frame { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  // ========== LOAD GOOGLE TRANSLATE SCRIPT ==========
  function loadGoogleTranslate() {
    if (googleTranslateLoaded) return;
    if (document.getElementById('google-translate-script')) return;

    injectGoogleElement();
    injectStyles();

    window.googleTranslateElementInit = function() {
      const includedLangs = LANGUAGES.map(l => l.code).join(',');
      translateInstance = new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: includedLangs,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
      googleTranslateLoaded = true;

      // Apply saved language after Google loads
      const savedLang = localStorage.getItem(STORAGE_KEY);
      if (savedLang && savedLang !== 'en') {
        setTimeout(() => applyLanguage(savedLang), 800);
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  // ========== APPLY LANGUAGE ==========
  function applyLanguage(langCode) {
    if (!googleTranslateLoaded || !translateInstance) {
      setTimeout(() => applyLanguage(langCode), 500);
      return;
    }

    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      localStorage.setItem(STORAGE_KEY, langCode);
      updateDropdownLabel(langCode);
    } else {
      // Fallback: try again
      setTimeout(() => applyLanguage(langCode), 300);
    }
  }

  // ========== BUILD CUSTOM DROPDOWN ==========
  function buildDropdown() {
    if (document.getElementById('apexvault-lang-dropdown')) return;

    const container = document.createElement('div');
    container.id = 'apexvault-lang-dropdown';
    container.className = 'apexvault-lang-dropdown';

    const savedLang = localStorage.getItem(STORAGE_KEY) || 'en';
    const currentLang = LANGUAGES.find(l => l.code === savedLang) || LANGUAGES[0];

    container.innerHTML = `
      <button class="lang-toggle" id="langToggle" title="Change Language">
        <span class="lang-flag">${currentLang.flag}</span>
        <span class="lang-name">${currentLang.name}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-left:4px;opacity:0.6;">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="lang-menu" id="langMenu">
        <div class="lang-search">
          <input type="text" id="langSearch" placeholder="Search language..." autocomplete="off">
        </div>
        <div class="lang-list" id="langList">
          ${LANGUAGES.map(l => `
            <button class="lang-option${l.code === savedLang ? ' active' : ''}" data-code="${l.code}">
              <span class="lang-option-flag">${l.flag}</span>
              <span class="lang-option-name">${l.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(container);
    attachDropdownEvents();
  }

  function attachDropdownEvents() {
    const toggle = document.getElementById('langToggle');
    const menu = document.getElementById('langMenu');
    const search = document.getElementById('langSearch');
    const list = document.getElementById('langList');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      if (menu.classList.contains('open') && search) {
        search.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    // Language selection
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-option');
      if (!btn) return;
      const code = btn.dataset.code;
      applyLanguage(code);
      menu.classList.remove('open');

      list.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    // Search filter
    if (search) {
      search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        list.querySelectorAll('.lang-option').forEach(btn => {
          const name = btn.querySelector('.lang-option-name').textContent.toLowerCase();
          btn.style.display = name.includes(term) ? 'flex' : 'none';
        });
      });
    }
  }

  function updateDropdownLabel(code) {
    const lang = LANGUAGES.find(l => l.code === code);
    if (!lang) return;
    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.querySelector('.lang-flag').textContent = lang.flag;
      toggle.querySelector('.lang-name').textContent = lang.name;
    }
  }

  // ========== INJECT DROPDOWN STYLES ==========
  function injectDropdownStyles() {
    if (document.getElementById('apexvault-dropdown-styles')) return;
    const style = document.createElement('style');
    style.id = 'apexvault-dropdown-styles';
    style.textContent = `
      .apexvault-lang-dropdown {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9999;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      }
      .lang-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: rgba(17, 34, 64, 0.9);
        border: 1px solid #233554;
        border-radius: 10px;
        color: #ccd6f6;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
        white-space: nowrap;
      }
      .lang-toggle:hover {
        border-color: #64ffda;
        background: rgba(17, 34, 64, 1);
      }
      .lang-flag { font-size: 1rem; }
      .lang-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
      .lang-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 260px;
        max-height: 380px;
        background: rgba(17, 34, 64, 0.98);
        border: 1px solid #233554;
        border-radius: 14px;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.25s ease;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
      }
      .lang-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .lang-search {
        padding: 12px;
        border-bottom: 1px solid #233554;
        flex-shrink: 0;
      }
      .lang-search input {
        width: 100%;
        padding: 10px 14px;
        background: #0a0e1a;
        border: 1px solid #233554;
        border-radius: 8px;
        color: #ccd6f6;
        font-size: 0.85rem;
        outline: none;
        font-family: 'Inter', sans-serif;
      }
      .lang-search input:focus {
        border-color: #64ffda;
      }
      .lang-search input::placeholder {
        color: #8892b0;
      }
      .lang-list {
        overflow-y: auto;
        padding: 6px;
        scrollbar-width: thin;
        scrollbar-color: #233554 transparent;
      }
      .lang-list::-webkit-scrollbar { width: 4px; }
      .lang-list::-webkit-scrollbar-thumb { background: #233554; border-radius: 4px; }
      .lang-option {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        background: none;
        border: none;
        border-radius: 8px;
        color: #ccd6f6;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
        font-family: 'Inter', sans-serif;
      }
      .lang-option:hover {
        background: rgba(100, 255, 218, 0.08);
        color: #64ffda;
      }
      .lang-option.active {
        background: rgba(100, 255, 218, 0.12);
        color: #64ffda;
      }
      .lang-option-flag { font-size: 1.1rem; flex-shrink: 0; }
      .lang-option-name { flex: 1; }
      @media (max-width: 480px) {
        .apexvault-lang-dropdown { top: 10px; right: 10px; }
        .lang-toggle { padding: 6px 10px; font-size: 0.8rem; }
        .lang-menu { width: 220px; max-height: 320px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ========== INIT ==========
  function init() {
    injectDropdownStyles();
    buildDropdown();
    loadGoogleTranslate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
