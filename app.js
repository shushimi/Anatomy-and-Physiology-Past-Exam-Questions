// データファイルからテキストを読み込む
import { lessonText1 } from './data/lesson_01.js';

// ==========================================
// MarkdownをHTMLに変換する関数
// ==========================================
function parseMarkdown(text) {
  const lines = text.trim().split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    // **文字** を <span class="mask">タグに変換（クリックイベントは後で付与）
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<span class="mask">$1</span>');

    if (processed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${processed.substring(3)}</h2>`;
    } else if (processed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${processed.substring(4)}</h3>`;
    } else if (processed.startsWith('> ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<div class="note">${processed.substring(2)}</div>`;
    } else if (processed.startsWith('* ') || processed.startsWith(' * ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${processed.replace(/^\s*\*\s/, '')}</li>`;
    } else if (processed.trim() === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${processed}</p>`;
    }
  });
  if (inList) { html += '</ul>'; }
  return html;
}

// ==========================================
// 画面の初期化・イベント設定
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('lesson-content');

  // 1. 変換したHTMLを画面にセット
  contentArea.innerHTML = parseMarkdown(lessonText1);

  // 2. 暗記マーカーのタップイベントを一括設定（イベントデリゲーション）
  contentArea.addEventListener('click', (event) => {
    // クリックされた要素が 'mask' クラスを持っていれば、'revealed' を切り替える
    if (event.target.classList.contains('mask')) {
      event.target.classList.toggle('revealed');
    }
  });
});
