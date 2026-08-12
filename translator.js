/* ========== APEXVAULT UNIVERSAL TRANSLATOR v4 (MULTI-ENGINE) ========== */
/* Tries: 1) Browser Native API → 2) Lingva.ml (Google proxy) → 3) LibreTranslate */
(function() {
  'use strict';

  console.log('[ApexVault Translator v4] Initializing...');

  const STORAGE_KEY = 'apexvault_lang_v4';

  /* ========== API CONFIG ========== */
  const APIS = {
    lingva: {
      name: 'Lingva.ml',
      url: 'https://lingva.ml/api/v1/en/{target}/{text}',
      type: 'GET'
    },
    libre1: {
      name: 'LibreTranslate (de)',
      url: 'https://libretranslate.de/translate',
      type: 'POST'
    },
    libre2: {
      name: 'LibreTranslate (com)',
      url: 'https://libretranslate.com/translate',
      type: 'POST'
    }
  };

  const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', api: 'en' },
    { code: 'es', name: 'Español', flag: '🇪🇸', api: 'es' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', api: 'fr' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', api: 'de' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', api: 'it' },
    { code: 'pt', name: 'Português', flag: '🇵🇹', api: 'pt' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', api: 'ru' },
    { code: 'zh', name: '中文', flag: '🇨🇳', api: 'zh' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', api: 'ja' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', api: 'ko' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', api: 'ar' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷', api: 'fa' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', api: 'hi' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', api: 'tr' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱', api: 'pl' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱', api: 'nl' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪', api: 'sv' },
    { code: 'da', name: 'Dansk', flag: '🇩🇰', api: 'da' },
    { code: 'fi', name: 'Suomi', flag: '🇫🇮', api: 'fi' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿', api: 'cs' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺', api: 'hu' },
    { code: 'ro', name: 'Română', flag: '🇷🇴', api: 'ro' },
    { code: 'bg', name: 'Български', flag: '🇧🇬', api: 'bg' },
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', api: 'hr' },
    { code: 'sr', name: 'Српски', flag: '🇷🇸', api: 'sr' },
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰', api: 'sk' },
    { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', api: 'sl' },
    { code: 'et', name: 'Eesti', flag: '🇪🇪', api: 'et' },
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻', api: 'lv' },
    { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', api: 'lt' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦', api: 'uk' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', api: 'vi' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭', api: 'th' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', api: 'id' },
    { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', api: 'ms' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭', api: 'tl' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩', api: 'bn' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', api: 'ta' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳', api: 'te' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳', api: 'mr' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', api: 'gu' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', api: 'kn' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳', api: 'ml' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰', api: 'si' },
    { code: 'my', name: 'မြန်မာ', flag: '🇲🇲', api: 'my' },
    { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭', api: 'km' },
    { code: 'lo', name: 'ລາວ', flag: '🇱🇦', api: 'lo' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵', api: 'ne' },
    { code: 'mn', name: 'Монгол', flag: '🇲🇳', api: 'mn' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦', api: 'af' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', api: 'sw' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦', api: 'zu' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹', api: 'am' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬', api: 'ha' },
    { code: 'yo', name: 'Yorùbá', flag: '🇳🇬', api: 'yo' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬', api: 'ig' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', api: 'el' },
    { code: 'he', name: 'עברית', flag: '🇮🇱', api: 'he' },
    { code: 'ka', name: 'ქართული', flag: '🇬🇪', api: 'ka' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿', api: 'az' },
    { code: 'sq', name: 'Shqip', flag: '🇦🇱', api: 'sq' },
    { code: 'mk', name: 'Македонски', flag: '🇲🇰', api: 'mk' },
    { code: 'be', name: 'Беларуская', flag: '🇧🇾', api: 'be' },
    { code: 'kk', name: 'Қазақша', flag: '🇰🇿', api: 'kk' },
    { code: 'uz', name: "O'zbek", flag: '🇺🇿', api: 'uz' },
    { code: 'ky', name: 'Кыргызча', flag: '🇰🇬', api: 'ky' },
    { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯', api: 'tg' },
    { code: 'hy', name: 'Հայերեն', flag: '🇦🇲', api: 'hy' }
  ];

  let originalTexts = new Map();
  let isTranslating = false;
  let currentLang = 'en';
  let nativeTranslator = null;

  /* ========== BROWSER NATIVE TRANSLATOR API (Chrome 138+, Edge 148+) ========== */
  async function initNativeTranslator(targetLang) {
    if (!('Translator' in window)) {
      console.log('[ApexVault Translator] Browser native Translator API not available');
      return null;
    }
    try {
      const pair = { sourceLanguage: 'en', targetLanguage: targetLang };
      const availability = await window.Translator.availability(pair);
      console.log('[ApexVault Translator] Native API availability:', availability);
      if (availability === 'unavailable') return null;

      const translator = await window.Translator.create(pair);
      console.log('[ApexVault Translator] Native translator created for', targetLang);
      return translator;
    } catch (e) {
      console.log('[ApexVault Translator] Native translator failed:', e.message);
      return null;
    }
  }

  /* ========== EXTRACT TEXT NODES ========== */
  function getTextNodes(root) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      function(node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre') return NodeFilter.FILTER_REJECT;
        if (parent.closest('#av-lang-btn')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.notranslate')) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
      false
    );
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  /* ========== SAVE ORIGINAL TEXTS ========== */
  function saveOriginals() {
    if (originalTexts.size > 0) return;
    var nodes = getTextNodes(document.body);
    nodes.forEach(function(node, i) {
      var key = 'av-node-' + i;
      node.setAttribute('data-av-id', key);
      originalTexts.set(key, node.textContent);
    });
    console.log('[ApexVault Translator] Saved', originalTexts.size, 'text nodes');
  }

  /* ========== TRANSLATE SINGLE TEXT ========== */
  async function translateOne(text, target, attempt) {
    attempt = attempt || 0;
    var apis = ['lingva', 'libre1', 'libre2'];
    var apiName = apis[attempt] || apis[0];
    var api = APIS[apiName];

    try {
      if (apiName === 'lingva') {
        /* Lingva.ml - GET request, Google Translate proxy */
        var url = api.url.replace('{target}', encodeURIComponent(target)).replace('{text}', encodeURIComponent(text));
        console.log('[ApexVault Translator] Trying Lingva:', url.substring(0, 100));
        var res = await fetch(url, { method: 'GET', mode: 'cors' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (data.translation) {
          console.log('[ApexVault Translator] Lingva success:', text.substring(0, 30), '→', data.translation.substring(0, 30));
          return data.translation;
        }
        throw new Error('No translation in response');
      } else {
        /* LibreTranslate - POST request */
        var body = 'source=en&target=' + encodeURIComponent(target) + '&format=text&q=' + encodeURIComponent(text);
        console.log('[ApexVault Translator] Trying', api.name);
        var res = await fetch(api.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        var translated = Array.isArray(data) ? (data[0] && data[0].translatedText) : data.translatedText;
        if (translated) {
          console.log('[ApexVault Translator]', api.name, 'success');
          return translated;
        }
        throw new Error('No translation in response');
      }
    } catch (err) {
      console.warn('[ApexVault Translator]', api.name, 'failed:', err.message);
      if (attempt < apis.length - 1) {
        return translateOne(text, target, attempt + 1);
      }
      return text; /* Return original if all fail */
    }
  }

  /* ========== BATCH TRANSLATE ========== */
  async function translateBatch(texts, target) {
    /* Deduplicate */
    var unique = [];
    var seen = {};
    texts.forEach(function(t) {
      var key = t.trim();
      if (!seen[key] && key.length > 1 && /[a-zA-Z]/.test(key)) {
        seen[key] = true;
        unique.push(key);
      }
    });

    if (unique.length === 0) return {};

    var results = {};

    /* Try native translator first if available */
    if (nativeTranslator) {
      console.log('[ApexVault Translator] Using native browser translator for', unique.length, 'items');
      for (var i = 0; i < unique.length; i++) {
        try {
          results[unique[i]] = await nativeTranslator.translate(unique[i]);
        } catch (e) {
          results[unique[i]] = unique[i];
        }
      }
      return results;
    }

    /* API-based translation with delay between requests */
    console.log('[ApexVault Translator] Using API translation for', unique.length, 'items');
    for (var i = 0; i < unique.length; i++) {
      var txt = unique[i];
      results[txt] = await translateOne(txt, target, 0);
      /* Small delay to avoid rate limits */
      if (i < unique.length - 1) {
        await new Promise(function(r) { setTimeout(r, 300); });
      }
    }
    return results;
  }

  /* ========== APPLY TRANSLATION ========== */
  async function applyTranslation(targetCode) {
    if (isTranslating) return;
    isTranslating = true;

    var btn = document.getElementById('avLangToggle');
    if (btn) {
      btn.style.opacity = '0.5';
      btn.querySelector('#avLangName').textContent = 'Translating...';
    }

    try {
      if (targetCode === 'en') {
        restoreEnglish();
        currentLang = 'en';
        localStorage.setItem(STORAGE_KEY, 'en');
        updateBtn('en');
        console.log('[ApexVault Translator] Restored English');
        return;
      }

      saveOriginals();

      /* Try to init native translator */
      nativeTranslator = await initNativeTranslator(targetCode);

      var nodes = getTextNodes(document.body);
      var texts = [];
      var nodeMap = [];

      nodes.forEach(function(node) {
        var original = originalTexts.get(node.getAttribute('data-av-id'));
        var text = original || node.textContent;
        if (text.trim().length > 1 && /[a-zA-Z]/.test(text)) {
          texts.push(text);
          nodeMap.push(node);
        }
      });

      console.log('[ApexVault Translator] Translating', texts.length, 'text nodes to', targetCode);

      if (texts.length === 0) {
        console.warn('[ApexVault Translator] No translatable text found');
        currentLang = targetCode;
        localStorage.setItem(STORAGE_KEY, targetCode);
        updateBtn(targetCode);
        return;
      }

      /* Translate in chunks to avoid overwhelming APIs */
      var chunkSize = nativeTranslator ? 50 : 8;
      for (var i = 0; i < texts.length; i += chunkSize) {
        var chunkTexts = texts.slice(i, i + chunkSize);
        var chunkNodes = nodeMap.slice(i, i + chunkSize);
        var results = await translateBatch(chunkTexts, targetCode);

        chunkNodes.forEach(function(node, idx) {
          var original = chunkTexts[idx];
          var translated = results[original];
          if (translated && translated !== original) {
            node.textContent = translated;
          }
        });

        /* Progress update */
        if (btn) {
          var pct = Math.round(((i + chunkTexts.length) / texts.length) * 100);
          btn.querySelector('#avLangName').textContent = 'Translating ' + pct + '%';
        }

        /* Delay between chunks */
        if (i + chunkSize < texts.length) {
          await new Promise(function(r) { setTimeout(r, 500); });
        }
      }

      currentLang = targetCode;
      localStorage.setItem(STORAGE_KEY, targetCode);
      updateBtn(targetCode);
      console.log('[ApexVault Translator] Done! Translated to', targetCode);
    } catch (err) {
      console.error('[ApexVault Translator] Fatal error:', err);
      alert('Translation failed. Check browser console (F12 → Console) for details.\n\nCommon causes:\n• API rate limit (wait 1 minute)\n• Browser blocking CORS\n• No internet connection');
    } finally {
      isTranslating = false;
      if (btn) btn.style.opacity = '1';
    }
  }

  function restoreEnglish() {
    var nodes = getTextNodes(document.body);
    nodes.forEach(function(node) {
      var key = node.getAttribute('data-av-id');
      if (key && originalTexts.has(key)) {
        node.textContent = originalTexts.get(key);
      }
    });
  }

  /* ========== SET LANGUAGE ========== */
  function setLang(code) {
    var lang = LANGUAGES.find(function(l) { return l.code === code; });
    if (!lang) return;
    applyTranslation(lang.api);
  }

  /* ========== BUILD UI ========== */
  function buildUI() {
    if (document.getElementById('av-lang-btn')) return;

    var saved = localStorage.getItem(STORAGE_KEY) || 'en';
    var cur = LANGUAGES.find(function(l) { return l.code === saved; }) || LANGUAGES[0];

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
          LANGUAGES.map(function(l) {
            return '<button class="avLangOpt' + (l.code === saved ? ' active' : '') + '" data-code="' + l.code + '"><span class="avLangOptFlag">' + l.flag + '</span><span class="avLangOptName">' + l.name + '</span></button>';
          }).join('') +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    bindEvents();
    console.log('[ApexVault Translator v4] Dropdown created');
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
      list.querySelectorAll('.avLangOpt').forEach(function(b) { b.classList.remove('active'); });
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
    var l = LANGUAGES.find(function(x) { return x.code === code; });
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

  /* ========== AUTO-RESTORE ON LOAD ========== */
  function autoRestore() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en') {
      console.log('[ApexVault Translator] Auto-restoring language:', saved);
      setTimeout(function() {
        setLang(saved);
      }, 1500);
    }
  }

  /* ========== START ========== */
  function start() {
    try {
      injectStyles();
      buildUI();
      autoRestore();
      console.log('[ApexVault Translator v4] Ready. Press F12 → Console to see live logs.');
    } catch (err) {
      console.error('[ApexVault Translator v4] Error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
