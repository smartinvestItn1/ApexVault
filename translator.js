/* ========== APEXVAULT UNIVERSAL TRANSLATOR v2.1 (FIXED) ========== */
(function() {
  'use strict';

  console.log('[ApexVault Translator] Initializing...');

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
    { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' },
    { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
    { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' }
  ];

  let googleReady = false;

  /* ========== HIDE GOOGLE UI ========== */
  function hideGoogleUI() {
    var s = document.createElement('style');
    s.id = 'av-translate-hide';
    s.textContent = '.goog-te-banner-frame,.goog-te-menu-value,.goog-te-gadget,.goog-te-gadget-simple,#goog-gt-tt,.goog-tooltip,.goog-text-highlight,.skiptranslate iframe,.goog-logo-link,.goog-te-combo,.goog-te-balloon-frame,#goog-gt-,.goog-te-menu-frame,.goog-te-menu2,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-l4eHX-hSRGPd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-ZVi9od-aZ2wEe-OqVKwc,.VIpgJd-yAWNEb-L7lbkb,.VIpgJd-ZVi9od-xl07Ob-lTBxed,.VIpgJd-ZVi9od-SmfZ-OEVmcd,.VIpgJd-ZVi9od-ORHb,.VIpgJd-ZVi9od-SmfZ,.VIpgJd-ZVi9od-xl07Ob,.VIpgJd-ZVi9od-vH1Gmf,.VIpgJd-ZVi9od-l4eHX-hSRGPd{display:none!important}body{top:0!important}.translated-ltr body{top:0!important}.translated-rtl body{top:0!important}';
    document.head.appendChild(s);
  }

  /* ========== GOOGLE TRANSLATE INIT ========== */
  function initGoogle() {
    if (document.getElementById('google_translate_element')) return;
    var d = document.createElement('div');
    d.id = 'google_translate_element';
    d.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;visibility:hidden;';
    document.body.appendChild(d);

    window.googleTranslateElementInit = function() {
      var langs = LANGUAGES.map(function(l){return l.code;}).join(',');
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: langs,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
      googleReady = true;
      console.log('[ApexVault Translator] Google Translate loaded');
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'en') {
        setTimeout(function(){ setLang(saved); }, 800);
      }
    };

    var sc = document.createElement('script');
    sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    sc.async = true;
    sc.onerror = function() {
      console.error('[ApexVault Translator] Failed to load Google Translate');
    };
    document.head.appendChild(sc);
  }

  /* ========== SET LANGUAGE (FIXED) ========== */
  function setLang(code) {
    if (!googleReady) {
      setTimeout(function(){ setLang(code); }, 500);
      return;
    }

    function doChange(sel) {
      sel.value = code;

      // Method 1: Modern Event with bubbles
      if (typeof Event === 'function') {
        var ev1 = new Event('change', { bubbles: true, cancelable: true });
        sel.dispatchEvent(ev1);
      }

      // Method 2: Legacy HTMLEvents (more compatible with Google's internal handlers)
      if (document.createEvent) {
        var ev2 = document.createEvent('HTMLEvents');
        ev2.initEvent('change', true, true);
        sel.dispatchEvent(ev2);
      }

      // Method 3: IE fallback
      if (sel.fireEvent) {
        sel.fireEvent('onchange');
      }

      localStorage.setItem(STORAGE_KEY, code);
      updateBtn(code);
      console.log('[ApexVault Translator] Language set to:', code);
      return true;
    }

    function attempt() {
      var sel = document.querySelector('.goog-te-combo');
      if (sel) {
        doChange(sel);
        return true;
      }
      return false;
    }

    if (!attempt()) {
      var tries = 0;
      var timer = setInterval(function() {
        tries++;
        if (attempt() || tries > 30) {
          clearInterval(timer);
          if (tries > 30) {
            console.error('[ApexVault Translator] Could not find Google Translate select box after 30 tries');
          }
        }
      }, 300);
    }
  }

  /* ========== BUILD UI ========== */
  function buildUI() {
    if (document.getElementById('av-lang-btn')) return;

    var saved = localStorage.getItem(STORAGE_KEY) || 'en';
    var cur = LANGUAGES.find(function(l){return l.code===saved;}) || LANGUAGES[0];

    var wrap = document.createElement('div');
    wrap.id = 'av-lang-btn';
    wrap.innerHTML =
      '<button id="avLangToggle" title="Change Language">' +
        '<span id="avLangFlag">' + cur.flag + '</span>' +
        '<span id="avLangName">' + cur.name + '</span>' +
        '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" style="margin-left:4px;opacity:0.7;"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<div id="avLangMenu">' +
        '<div id="avLangSearchWrap"><input type="text" id="avLangSearch" placeholder="Search language..." autocomplete="off"></div>' +
        '<div id="avLangList">' +
          LANGUAGES.map(function(l){
            return '<button class="avLangOpt' + (l.code===saved?' active':'') + '" data-code="' + l.code + '"><span class="avLangOptFlag">' + l.flag + '</span><span class="avLangOptName">' + l.name + '</span></button>';
          }).join('') +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    bindEvents();
    console.log('[ApexVault Translator] Dropdown created');
  }

  function bindEvents() {
    var toggle = document.getElementById('avLangToggle');
    var menu = document.getElementById('avLangMenu');
    var search = document.getElementById('avLangSearch');
    var list = document.getElementById('avLangList');
    var wrap = document.getElementById('av-lang-btn');

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('open');
      if (menu.classList.contains('open') && search) search.focus();
    });

    document.addEventListener('click', function(e) {
      if (wrap && !wrap.contains(e.target)) menu.classList.remove('open');
    });

    list.addEventListener('click', function(e) {
      var btn = e.target.closest('.avLangOpt');
      if (!btn) return;
      var code = btn.getAttribute('data-code');
      setLang(code);
      menu.classList.remove('open');
      list.querySelectorAll('.avLangOpt').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
    });

    if (search) {
      search.addEventListener('input', function(e) {
        var term = e.target.value.toLowerCase();
        list.querySelectorAll('.avLangOpt').forEach(function(btn) {
          var name = btn.querySelector('.avLangOptName').textContent.toLowerCase();
          btn.style.display = name.indexOf(term) !== -1 ? 'flex' : 'none';
        });
      });
    }
  }

  function updateBtn(code) {
    var l = LANGUAGES.find(function(x){return x.code===code;});
    if (!l) return;
    var f = document.getElementById('avLangFlag');
    var n = document.getElementById('avLangName');
    if (f) f.textContent = l.flag;
    if (n) n.textContent = l.name;
  }

  /* ========== STYLES ========== */
  function injectStyles() {
    if (document.getElementById('av-translate-style')) return;
    var s = document.createElement('style');
    s.id = 'av-translate-style';
    s.textContent =
      '#av-lang-btn{position:fixed!important;top:12px!important;right:12px!important;z-index:99999!important;font-family:"Inter","Segoe UI",system-ui,sans-serif!important;}' +
      '#avLangToggle{display:flex!important;align-items:center!important;gap:6px!important;padding:10px 16px!important;background:rgba(17,34,64,0.95)!important;border:2px solid #64ffda!important;border-radius:12px!important;color:#fff!important;font-size:0.9rem!important;font-weight:700!important;cursor:pointer!important;backdrop-filter:blur(12px)!important;box-shadow:0 4px 20px rgba(0,212,170,0.25)!important;transition:all 0.2s!important;}' +
      '#avLangToggle:hover{box-shadow:0 6px 30px rgba(0,212,170,0.4)!important;transform:translateY(-1px)!important;}' +
      '#avLangFlag{font-size:1.1rem!important;}' +
      '#avLangName{max-width:110px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}' +
      '#avLangMenu{position:absolute!important;top:calc(100% + 10px)!important;right:0!important;width:280px!important;max-height:400px!important;background:rgba(17,34,64,0.98)!important;border:1px solid #233554!important;border-radius:16px!important;overflow:hidden!important;opacity:0!important;visibility:hidden!important;transform:translateY(-10px)!important;transition:all 0.25s ease!important;box-shadow:0 25px 60px rgba(0,0,0,0.6)!important;display:flex!important;flex-direction:column!important;}' +
      '#avLangMenu.open{opacity:1!important;visibility:visible!important;transform:translateY(0)!important;}' +
      '#avLangSearchWrap{padding:14px!important;border-bottom:1px solid #233554!important;flex-shrink:0!important;}' +
      '#avLangSearch{width:100%!important;padding:12px 16px!important;background:#0a0e1a!important;border:1px solid #233554!important;border-radius:10px!important;color:#ccd6f6!important;font-size:0.9rem!important;outline:none!important;font-family:"Inter",sans-serif!important;font-weight:600!important;}' +
      '#avLangSearch:focus{border-color:#64ffda!important;}' +
      '#avLangSearch::placeholder{color:#8892b0!important;}' +
      '#avLangList{overflow-y:auto!important;padding:8px!important;scrollbar-width:thin!important;scrollbar-color:#233554 transparent!important;}' +
      '#avLangList::-webkit-scrollbar{width:5px!important;}' +
      '#avLangList::-webkit-scrollbar-thumb{background:#233554!important;border-radius:4px!important;}' +
      '.avLangOpt{display:flex!important;align-items:center!important;gap:10px!important;width:100%!important;padding:11px 14px!important;background:none!important;border:none!important;border-radius:10px!important;color:#ccd6f6!important;font-size:0.92rem!important;font-weight:600!important;cursor:pointer!important;text-align:left!important;transition:all 0.15s!important;font-family:"Inter",sans-serif!important;}' +
      '.avLangOpt:hover{background:rgba(100,255,218,0.1)!important;color:#64ffda!important;}' +
      '.avLangOpt.active{background:rgba(100,255,218,0.15)!important;color:#64ffda!important;}' +
      '.avLangOptFlag{font-size:1.15rem!important;flex-shrink:0!important;}' +
      '.avLangOptName{flex:1!important;}' +
      '@media(max-width:480px){#av-lang-btn{top:8px!important;right:8px!important;}#avLangToggle{padding:8px 12px!important;font-size:0.82rem!important;}#avLangMenu{width:240px!important;max-height:340px!important;}}';
    document.head.appendChild(s);
  }

  /* ========== START ========== */
  function start() {
    try {
      hideGoogleUI();
      injectStyles();
      buildUI();
      initGoogle();
      console.log('[ApexVault Translator] Ready');
    } catch (err) {
      console.error('[ApexVault Translator] Error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
