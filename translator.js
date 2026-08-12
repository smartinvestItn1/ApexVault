/* ========== APEXVAULT UNIVERSAL TRANSLATOR v13 (FAST) ========== */
/* Parallel batching (4 at once) + localStorage cache = 4-10x faster */
(function() {
  'use strict';

  const STORAGE_KEY = 'apexvault_lang_v13';
  const CACHE_KEY = 'apexvault_cache_v13';
  const CHUNK_SIZE = 900;
  const DELAY_MS = 150;
  const FETCH_TIMEOUT = 8000;
  const BATCH_SIZE = 4;

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

  let isTranslating = false;
  let currentLang = 'en';
  let cache = {};

  /* ========== LOAD CACHE ========== */
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (raw) cache = JSON.parse(raw);
  } catch(e) { cache = {}; }

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
  }

  function getCacheKey(text, target) {
    return target + '::' + text;
  }

  function getCached(text, target) {
    return cache[getCacheKey(text, target)];
  }

  function setCached(text, target, translated) {
    cache[getCacheKey(text, target)] = translated;
    saveCache();
  }

  /* ========== FETCH WITH TIMEOUT ========== */
  function fetchWithTimeout(url, options, ms) {
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() { reject(new Error('Timeout')); }, ms);
      fetch(url, options).then(function(res) { clearTimeout(timer); resolve(res); })
        .catch(function(err) { clearTimeout(timer); reject(err); });
    });
  }

  /* ========== EXTRACT TEXT NODES ========== */
  function getTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, function(node) {
      var parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      var tag = parent.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre') return NodeFilter.FILTER_REJECT;
      if (parent.closest('#av-lang-btn')) return NodeFilter.FILTER_REJECT;
      if (parent.closest('.notranslate')) return NodeFilter.FILTER_REJECT;
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  /* ========== SAVE ORIGINALS ========== */
  function saveOriginals() {
    var nodes = getTextNodes(document.body);
    nodes.forEach(function(node) {
      if (node._avOriginal === undefined) node._avOriginal = node.textContent;
    });
  }

  /* ========== SPLIT TEXT INTO CHUNKS ========== */
  function splitIntoChunks(text, maxBytes) {
    var chunks = [];
    var current = '';
    var currentBytes = 0;
    var sentences = text.split(/(?<=[.!?
])\s+/);
    sentences.forEach(function(sentence) {
      var sentenceBytes = new Blob([sentence]).size;
      if (sentenceBytes > maxBytes) {
        var words = sentence.split(' ');
        words.forEach(function(word) {
          var wordBytes = new Blob([word + ' ']).size;
          if (currentBytes + wordBytes > maxBytes && current) {
            chunks.push(current.trim());
            current = word + ' ';
            currentBytes = wordBytes;
          } else {
            current += word + ' ';
            currentBytes += wordBytes;
          }
        });
      } else if (currentBytes + sentenceBytes > maxBytes && current) {
        chunks.push(current.trim());
        current = sentence + ' ';
        currentBytes = sentenceBytes;
      } else {
        current += sentence + ' ';
        currentBytes += sentenceBytes;
      }
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  /* ========== MYMEMORY API ========== */
  async function translateMyMemory(text, target) {
    var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|' + target;
    var res = await fetchWithTimeout(url, { method: 'GET', mode: 'cors' }, FETCH_TIMEOUT);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error('Status ' + data.responseStatus);
  }

  /* ========== GOOGLE UNOFFICIAL API ========== */
  async function translateGoogle(text, target) {
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + target + '&dt=t&q=' + encodeURIComponent(text);
    var res = await fetchWithTimeout(url, { method: 'GET', mode: 'cors' }, FETCH_TIMEOUT);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) return data[0][0][0];
    throw new Error('Bad response');
  }

  /* ========== TRANSLATE ONE CHUNK ========== */
  async function translateChunk(text, target) {
    var cached = getCached(text, target);
    if (cached) return cached;
    try {
      var result = await translateMyMemory(text, target);
      setCached(text, target, result);
      return result;
    } catch (e1) {
      try {
        var result = await translateGoogle(text, target);
        setCached(text, target, result);
        return result;
      } catch (e2) {
        return text;
      }
    }
  }

  /* ========== TRANSLATE BATCH IN PARALLEL ========== */
  async function translateBatch(chunks, target) {
    var promises = chunks.map(function(chunk) {
      return translateChunk(chunk, target);
    });
    return await Promise.all(promises);
  }

  /* ========== APPLY TRANSLATION ========== */
  async function applyTranslation(targetCode) {
    if (isTranslating) return;
    isTranslating = true;

    var btn = document.getElementById('avLangToggle');
    var nameSpan = btn ? btn.querySelector('#avLangName') : null;

    function setStatus(txt) { if (nameSpan) nameSpan.textContent = txt; }

    try {
      if (targetCode === 'en') {
        restoreEnglish();
        currentLang = 'en';
        localStorage.setItem(STORAGE_KEY, 'en');
        updateBtn('en');
        setStatus('English');
        return;
      }

      saveOriginals();
      setStatus('Translating...');

      var nodes = getTextNodes(document.body);
      var items = [];
      nodes.forEach(function(node) {
        var original = node._avOriginal || node.textContent;
        var text = original.trim();
        if (text.length > 1 && /[a-zA-Z]/.test(text)) items.push({ node: node, text: text });
      });

      if (items.length === 0) {
        currentLang = targetCode;
        localStorage.setItem(STORAGE_KEY, targetCode);
        updateBtn(targetCode);
        return;
      }

      /* Build unique chunks */
      var uniqueMap = {};
      var uniqueChunks = [];
      items.forEach(function(item) {
        if (!uniqueMap[item.text]) {
          uniqueMap[item.text] = true;
          var chunks = splitIntoChunks(item.text, CHUNK_SIZE);
          chunks.forEach(function(chunk) { uniqueChunks.push({ fullText: item.text, chunk: chunk }); });
        }
      });

      console.log('[AVT] ' + uniqueChunks.length + ' chunks, batch size ' + BATCH_SIZE);

      /* Translate in parallel batches */
      var results = {};
      var total = uniqueChunks.length;
      var done = 0;

      for (var i = 0; i < total; i += BATCH_SIZE) {
        var batch = uniqueChunks.slice(i, i + BATCH_SIZE);
        var batchChunks = batch.map(function(b) { return b.chunk; });

        var translated = await translateBatch(batchChunks, targetCode);

        batch.forEach(function(b, idx) {
          results[b.chunk] = translated[idx];
        });

        done += batch.length;
        setStatus('Translating ' + Math.round((done / total) * 100) + '%');

        if (i + BATCH_SIZE < total) {
          await new Promise(function(r) { setTimeout(r, DELAY_MS); });
        }
      }

      /* Apply translations */
      items.forEach(function(item) {
        var chunks = splitIntoChunks(item.text, CHUNK_SIZE);
        var translatedParts = chunks.map(function(c) { return results[c] || c; });
        var fullTranslated = translatedParts.join(' ');
        if (fullTranslated !== item.text) item.node.textContent = fullTranslated;
      });

      currentLang = targetCode;
      localStorage.setItem(STORAGE_KEY, targetCode);
      updateBtn(targetCode);
      setStatus('Done!');
      setTimeout(function() {
        var l = LANGUAGES.find(function(x) { return x.code === targetCode; });
        if (l && nameSpan) nameSpan.textContent = l.name;
      }, 1200);
    } catch (err) {
      console.error('[AVT] Error:', err);
      setStatus('Error');
      setTimeout(function() {
        var l = LANGUAGES.find(function(x) { return x.code === currentLang; });
        if (l && nameSpan) nameSpan.textContent = l.name;
      }, 2000);
    } finally {
      isTranslating = false;
    }
  }

  function restoreEnglish() {
    var nodes = getTextNodes(document.body);
    nodes.forEach(function(node) {
      if (node._avOriginal !== undefined) node.textContent = node._avOriginal;
    });
  }

  function setLang(code) {
    var lang = LANGUAGES.find(function(l) { return l.code === code; });
    if (!lang) return;
    applyTranslation(lang.api);
  }

  function buildUI() {
    if (document.getElementById('av-lang-btn')) return;

    var saved = localStorage.getItem(STORAGE_KEY) || 'en';
    var cur = LANGUAGES.find(function(l) { return l.code === saved; }) || LANGUAGES[0];

    var wrap = document.createElement('div');
    wrap.id = 'av-lang-btn';
    wrap.style.cssText = 'position:fixed!important;top:80px!important;right:12px!important;z-index:99999!important;font-family:"Inter","Segoe UI",system-ui,sans-serif!important;';

    var btn = document.createElement('button');
    btn.id = 'avLangToggle';
    btn.title = 'Change Language';
    btn.style.cssText =
      'display:flex!important;align-items:center!important;gap:8px!important;' +
      'padding:10px 18px!important;margin:0!important;border:none!important;' +
      'background:rgba(17,34,64,0.95)!important;' +
      'border:2px solid #64ffda!important;border-radius:12px!important;' +
      'color:#fff!important;font-size:0.9rem!important;font-weight:700!important;' +
      'cursor:pointer!important;backdrop-filter:blur(12px)!important;' +
      'box-shadow:0 4px 20px rgba(0,212,170,0.35)!important;' +
      'transition:all 0.2s!important;outline:none!important;' +
      '-webkit-tap-highlight-color:transparent!important;';

    var flag = document.createElement('span');
    flag.id = 'avLangFlag';
    flag.textContent = cur.flag;
    flag.style.cssText = 'font-size:1.1rem!important;line-height:1!important;pointer-events:none!important;';

    var name = document.createElement('span');
    name.id = 'avLangName';
    name.textContent = cur.name;
    name.style.cssText = 'max-width:110px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;pointer-events:none!important;';

    var arrow = document.createElement('span');
    arrow.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" style="opacity:0.7;pointer-events:none;"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    arrow.style.cssText = 'display:flex!important;align-items:center!important;pointer-events:none!important;';

    btn.appendChild(flag);
    btn.appendChild(name);
    btn.appendChild(arrow);
    wrap.appendChild(btn);

    var menu = document.createElement('div');
    menu.id = 'avLangMenu';
    menu.innerHTML =
      '<div id="avLangSearchWrap"><input type="text" id="avLangSearch" placeholder="Search language..." autocomplete="off"></div>' +
      '<div id="avLangList">' +
        LANGUAGES.map(function(l) {
          return '<button class="avLangOpt' + (l.code === saved ? ' active' : '') + '" data-code="' + l.code + '"><span class="avLangOptFlag">' + l.flag + '</span><span class="avLangOptName">' + l.name + '</span></button>';
        }).join('') +
      '</div>';
    wrap.appendChild(menu);

    document.body.appendChild(wrap);
    bindEvents();
  }

  function bindEvents() {
    var toggle = document.getElementById('avLangToggle');
    var menu = document.getElementById('avLangMenu');
    var search = document.getElementById('avLangSearch');
    var list = document.getElementById('avLangList');
    var wrap = document.getElementById('av-lang-btn');

    if (!toggle) return;

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

  function injectStyles() {
    if (document.getElementById('av-translate-style')) return;
    var s = document.createElement('style');
    s.id = 'av-translate-style';
    s.textContent =
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
      '@media(max-width:480px){#av-lang-btn{top:70px!important;right:8px!important;}#avLangToggle{padding:8px 14px!important;font-size:0.82rem!important;}#avLangMenu{width:240px!important;max-height:340px!important;}}';
    document.head.appendChild(s);
  }

  function autoRestore() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en') setTimeout(function() { setLang(saved); }, 2000);
  }

  function start() {
    try {
      injectStyles();
      buildUI();
      autoRestore();
      console.log('[AVT] v13 Ready - Parallel batching + cache');
    } catch (err) {
      console.error('[AVT] Fatal start:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
