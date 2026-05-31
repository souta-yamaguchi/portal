'use strict';

(function () {
  const WORKER_URL = 'https://portal-chat-worker.oyoyo-aix.workers.dev/chat';
  const STORAGE_KEY = 'portal-chat-history-v1';
  const MAX_HISTORY = 10;

  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  if (!fab || !panel || !form) return;

  let history = loadHistory();
  let sending = false;

  // 初回はガイダンスを表示
  if (history.length === 0) {
    addBubble(
      'assistant',
      'こんにちは！このサイトのことや、AI のこと、雑談まで、なんでも聞いてください。日本語でどうぞ。'
    );
  } else {
    history.forEach(m => addBubble(m.role, m.content));
  }

  fab.addEventListener('click', () => {
    panel.classList.add('is-open');
    setTimeout(() => input.focus(), 200);
    scrollToBottom();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('is-open');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener('input', autoResize);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const text = input.value.trim();
    if (!text) return;

    sending = true;
    sendBtn.disabled = true;
    input.value = '';
    autoResize();

    addBubble('user', text);
    history.push({ role: 'user', content: text });
    pruneHistory();
    saveHistory();

    const typingEl = addTyping();

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      typingEl.remove();

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || `エラーが発生しました (${res.status})`;
        addBubble('system', msg);
      } else {
        const data = await res.json();
        const reply = data.reply || '（返答がありませんでした）';
        addBubble('assistant', reply);
        history.push({ role: 'assistant', content: reply });
        pruneHistory();
        saveHistory();
      }
    } catch (err) {
      typingEl.remove();
      addBubble('system', '通信エラーが発生しました。少し時間をおいてから再度お試しください。');
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  function addBubble(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg assistant';
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  function pruneHistory() {
    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) { /* noop */ }
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
})();
