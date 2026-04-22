// === PROMPT ENGINE PRO — app.js ===

// AUTO: gunakan endpoint yang sama (Vercel / lokal)
const API_URL = '/api/generate';

// === CHAR COUNT ===
var chatInput = document.getElementById('chatInput');
var charCount = document.getElementById('charCount');

chatInput.addEventListener('input', function() {
  var n = chatInput.value.length;
  charCount.textContent = n.toLocaleString('id-ID') + ' karakter';
});

// === GENERATE ===
async function generate() {
  var input = chatInput.value.trim();

  if (!input) {
    showError('Silakan masukkan teks chat terlebih dahulu.');
    return;
  }

  if (input.length < 10) {
    showError('Chat terlalu pendek. Minimal 10 karakter.');
    return;
  }

  var btn = document.getElementById('generateBtn');
  var btnText = document.getElementById('btnText');
  var btnLoader = document.getElementById('btnLoader');

  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  hideError();
  hideOutput();
  showLoading();

  var startTime = Date.now();

  var controller = new AbortController();
  var fetchTimer = setTimeout(function() {
    controller.abort();
  }, 25000);

  try {
    var response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: input }),
      signal: controller.signal,
    });

    clearTimeout(fetchTimer);

    var data;
    try {
      data = await response.json();
    } catch (_) {
      throw new Error('Server mengembalikan respons tidak valid. Coba lagi.');
    }

    var hasContent = data && (
      typeof data.cleaned === 'string' ||
      typeof data.reply_formal === 'string' ||
      typeof data.summary === 'string'
    );

    if (!response.ok && !hasContent) {
      throw new Error((data && data.error) || ('Server error (' + response.status + '). Coba lagi.'));
    }

    if (!hasContent) {
      throw new Error((data && data.error) || 'Respons AI kosong atau tidak valid. Coba lagi.');
    }

    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    renderOutput(data, elapsed);

  } catch (err) {
    clearTimeout(fetchTimer);
    console.error(err);
    if (err.name === 'AbortError') {
      showError('Request timeout. Server terlalu lama merespons. Coba lagi.');
    } else {
      showError('Terjadi kesalahan: ' + (err.message || 'Gagal menghubungi server. Coba lagi.'));
    }
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    hideLoading();
  }
}

// === RENDER OUTPUT ===
function renderOutput(data, elapsed) {
  function safe(v) {
    return (typeof v === 'string' && v.trim()) ? v.trim() : '—';
  }

  document.getElementById('cleanedText').textContent = safe(data.cleaned);
  document.getElementById('summaryText').textContent = safe(data.summary);
  document.getElementById('emotionText').textContent = safe(data.emotion);
  document.getElementById('replyFormal').textContent = safe(data.reply_formal);
  document.getElementById('replySemi').textContent = safe(data.reply_semi);
  document.getElementById('replyCasual').textContent = safe(data.reply_casual);
  document.getElementById('resultsMeta').textContent = 'Selesai dalam ' + elapsed + 's';

  renderClosings(data.closings);

  var outputSection = document.getElementById('outputSection');
  outputSection.classList.remove('hidden');

  var cards = outputSection.querySelectorAll('.card, .closing-item');
  cards.forEach(function(card) {
    card.style.animation = 'none';
    void card.offsetHeight;
    card.style.animation = '';
  });

  attachCopyButtons();

  setTimeout(function() {
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// === RENDER CLOSINGS ===
function renderClosings(closings) {
  var container = document.getElementById('closingsContainer');
  container.innerHTML = '';

  if (!Array.isArray(closings) || closings.length === 0) {
    container.innerHTML = '<div style="color:var(--gray-500);font-size:0.85rem;padding:12px;">Tidak ada data closing.</div>';
    return;
  }

  closings.forEach(function(text) {
    var safeText = (typeof text === 'string' && text.trim()) ? text.trim() : '—';

    var item = document.createElement('div');
    item.className = 'closing-item';

    var textEl = document.createElement('div');
    textEl.className = 'closing-text';
    textEl.textContent = safeText;

    var copyBtn = document.createElement('button');
    copyBtn.className = 'closing-copy';
    copyBtn.innerHTML = '&#9064; Copy';

    (function(t, b) {
      b.addEventListener('click', function() { copyToClipboard(t, b); });
    })(safeText, copyBtn);

    item.appendChild(textEl);
    item.appendChild(copyBtn);
    container.appendChild(item);
  });
}

// === ATTACH COPY BUTTONS ===
function attachCopyButtons() {
  document.querySelectorAll('.copy-btn[data-target]').forEach(function(btn) {
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function() {
      var targetId = newBtn.getAttribute('data-target');
      var el = document.getElementById(targetId);
      if (el && el.textContent.trim()) {
        copyToClipboard(el.textContent.trim(), newBtn);
      }
    });
  });
}

// === COPY TO CLIPBOARD ===
function copyToClipboard(text, btn) {
  if (!text || text === '—') return;

  function doFeedback() {
    showToast();
    if (btn) {
      var originalHTML = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '&#10003; Disalin';
      setTimeout(function() {
        btn.classList.remove('copied');
        btn.innerHTML = originalHTML;
      }, 2000);
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(doFeedback).catch(function() {
      fallbackCopy(text);
      doFeedback();
    });
  } else {
    fallbackCopy(text);
    doFeedback();
  }
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

// === TOAST ===
function showToast() {
  var toast = document.getElementById('toastBox');
  toast.classList.add('hidden');
  clearTimeout(window._toastTimer);
  void toast.offsetHeight;
  toast.classList.remove('hidden');
  window._toastTimer = setTimeout(function() {
    toast.classList.add('hidden');
  }, 2200);
}

// === UI HELPERS ===
function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorBox').classList.remove('hidden');
}
function hideError() { document.getElementById('errorBox').classList.add('hidden'); }
function showLoading() { document.getElementById('loadingState').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingState').classList.add('hidden'); }
function hideOutput() { document.getElementById('outputSection').classList.add('hidden'); }

// === KEYBOARD: Ctrl/Cmd + Enter ===
chatInput.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
});
