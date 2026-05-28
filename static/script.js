'use strict';

const EMOJI_FALLBACK = {
  '3D': '🏠',
  'Three.js': '🏠',
  'シミュレーター': '🏠',
  'ゲーム': '🎮',
  'パズル': '🧩',
  'Flask': '🐍',
  'YouTube': '📺',
  'AI': '🤖',
  '自動生成': '⚡',
};

function pickEmoji(tags) {
  for (const tag of tags || []) {
    if (EMOJI_FALLBACK[tag]) return EMOJI_FALLBACK[tag];
  }
  return '✨';
}

async function loadSites() {
  try {
    const res = await fetch('data/sites.json');
    const data = await res.json();
    renderOwner(data.owner);
    // 新形式 (sections) と旧形式 (sites) の両対応
    const sections = data.sections || [{ title: null, sites: data.sites || [] }];
    await renderSections(sections);
  } catch (err) {
    document.getElementById('sections-container').innerHTML =
      `<p class="loading">読み込み失敗: ${err.message}</p>`;
  }
}

function renderOwner(owner) {
  document.getElementById('owner-name').textContent = owner.name;
  const subtitleEl = document.getElementById('owner-subtitle');
  if (owner.subtitle) {
    subtitleEl.textContent = owner.subtitle;
  } else {
    subtitleEl.style.display = 'none';
  }
  const introEl = document.getElementById('owner-intro');
  if (owner.intro) {
    introEl.textContent = owner.intro;
  } else {
    introEl.style.display = 'none';
  }
  document.title = `${owner.name} — Works`;
}

async function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function renderSections(sections) {
  const container = document.getElementById('sections-container');
  container.innerHTML = '';

  for (const section of sections) {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'section';

    if (section.title) {
      const heading = document.createElement('h2');
      heading.className = 'section-heading';
      heading.textContent = section.title;
      sectionEl.appendChild(heading);
    }

    const grid = document.createElement('div');
    grid.className = 'sites';
    sectionEl.appendChild(grid);
    container.appendChild(sectionEl);

    for (const site of section.sites || []) {
      const card = document.createElement('a');
      card.className = 'card';
      card.href = site.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.style.setProperty('--accent', site.color || '#5b9bff');

      const hasThumb = site.thumbnail && (await imageExists(site.thumbnail));

      const tagsHtml = (site.tags || [])
        .map(t => `<span class="card-tag">${escapeHtml(t)}</span>`)
        .join('');

      card.innerHTML = `
        <div class="card-thumb ${hasThumb ? '' : 'placeholder'}"
             ${hasThumb ? `style="background-image: url('${site.thumbnail}');"` : ''}>
          ${hasThumb ? '' : `<div class="card-thumb-emoji">${pickEmoji(site.tags)}</div>`}
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(site.title)}</div>
          <div class="card-tagline">${escapeHtml(site.tagline || '')}</div>
          <div class="card-description">${escapeHtml(site.description || '')}</div>
          <div class="card-tags">${tagsHtml}</div>
          <div class="card-meta">
            <span class="card-stack">${escapeHtml(site.stack || '')}</span>
            <span class="card-arrow">→</span>
          </div>
          ${site.url_note ? `<div class="card-note">${escapeHtml(site.url_note)}</div>` : ''}
        </div>
      `;
      grid.appendChild(card);
    }
  }

  setupScrollFadeIn();
}

function setupScrollFadeIn() {
  const targets = document.querySelectorAll('.card, .section-heading');

  // Intersection Observer 非対応ブラウザは即表示
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // 同じ画面に複数のカードが入った時は少しずらしてフェードイン
  const seenSection = new WeakMap();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const section = el.closest('.section');
      const idx = (seenSection.get(section) || 0);
      seenSection.set(section, idx + 1);
      setTimeout(() => el.classList.add('is-visible'), idx * 220);
      observer.unobserve(el);
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 40px 0px',
  });

  // ヒーロー演出 (約 3 秒) が終わるまで observer を起動しない
  // これによりカードがタイトルより先に出ないようにする
  setTimeout(() => {
    targets.forEach(el => observer.observe(el));
  }, 3200);

  // フォールバック: 7 秒経っても見えていない要素は強制表示
  setTimeout(() => {
    targets.forEach(el => el.classList.add('is-visible'));
  }, 7000);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.getElementById('year').textContent = new Date().getFullYear();
loadSites();
