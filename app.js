import { lessonText1 } from './data/lesson_01.js';
import { questions1 } from './data/questions_01.js'; // 問題データを読み込み

// ==========================================
// 事前学習 (Markdownパース処理)
// ==========================================
function parseMarkdown(text) {
  const lines = text.trim().split('\n');
  let html = '';
  let inList = false;
  lines.forEach(line => {
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
// 問題演習のロジック（状態管理）
// ==========================================
let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let mistakeIds = []; // 間違えた問題のIDを記録

// タブ切り替え制御
function switchTab(tabName) {
  const lessonArea = document.getElementById('lesson-area');
  const quizArea = document.getElementById('quiz-area');
  const tabLesson = document.getElementById('tab-lesson');
  const tabQuiz = document.getElementById('tab-quiz');

  if (tabName === 'lesson') {
    lessonArea.classList.remove('hidden');
    quizArea.classList.add('hidden');
    tabLesson.className = "w-1/2 py-2 border-b-2 border-blue-600 text-blue-600 font-bold";
    tabQuiz.className = "w-1/2 py-2 border-b-2 border-transparent text-gray-500 font-bold hover:bg-gray-50";
  } else {
    lessonArea.classList.add('hidden');
    quizArea.classList.remove('hidden');
    tabLesson.className = "w-1/2 py-2 border-b-2 border-transparent text-gray-500 font-bold hover:bg-gray-50";
    tabQuiz.className = "w-1/2 py-2 border-b-2 border-blue-600 text-blue-600 font-bold";
    showScreen('quiz-start-screen'); // クイズ開始画面に戻す
  }
}

// 画面の表示切り替え
function showScreen(screenId) {
  document.getElementById('quiz-start-screen').classList.add('hidden');
  document.getElementById('quiz-play-screen').classList.add('hidden');
  document.getElementById('quiz-result-screen').classList.add('hidden');
  document.getElementById(screenId).classList.remove('hidden');
}

// クイズ開始
function startQuiz(isRandom = false, specificQuestions = null) {
  // 復習モード時は specificQuestions に問題配列が渡される
  let targetQuestions = specificQuestions ? specificQuestions : [...questions1];

  if (isRandom) {
    targetQuestions.sort(() => Math.random() - 0.5); // 簡易シャッフル
  }

  currentQuestions = targetQuestions;
  currentIndex = 0;
  correctCount = 0;
  mistakeIds = [];
  
  showScreen('quiz-play-screen');
  renderQuestion();
}

// 問題の描画
function renderQuestion() {
  const q = currentQuestions[currentIndex];
  document.getElementById('quiz-progress').textContent = `問題 ${currentIndex + 1} / ${currentQuestions.length}`;
  document.getElementById('question-text').textContent = q.text;

  // 選択肢の描画（イレギュラー対応のためチェックボックスを採用）
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';
  q.options.forEach((opt, index) => {
    const label = document.createElement('label');
    label.className = "flex items-center p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition";
    label.innerHTML = `
      <input type="checkbox" name="option" value="${index}" class="w-5 h-5 text-blue-600 mr-3">
      <span class="text-gray-800">${opt}</span>
    `;
    optionsContainer.appendChild(label);
  });

  // UIリセット
  document.getElementById('btn-submit').classList.remove('hidden');
  document.getElementById('result-area').classList.add('hidden');
}

// 解答ボタン押下時
function submitAnswer() {
  const q = currentQuestions[currentIndex];
  const checkboxes = document.querySelectorAll('input[name="option"]:checked');
  
  // 選択されたチェックボックスのvalue(文字列)を数値に変換して配列化
  const userAnswers = Array.from(checkboxes).map(cb => parseInt(cb.value)).sort();
  const correctAnswers = [...q.correctAnswers].sort();

  // 配列同士を文字列化して完全一致かチェック
  const isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);

  const resultArea = document.getElementById('result-area');
  const resultText = document.getElementById('result-text');
  
  resultArea.classList.remove('hidden');
  document.getElementById('btn-submit').classList.add('hidden');

  if (isCorrect) {
    resultText.textContent = "⭕ 正解！";
    resultText.className = "text-2xl font-bold mb-2 text-green-600";
    resultArea.className = "mt-6 p-4 rounded-lg bg-green-50 border border-green-200";
    correctCount++;
  } else {
    resultText.textContent = "❌ 不正解";
    resultText.className = "text-2xl font-bold mb-2 text-red-600";
    resultArea.className = "mt-6 p-4 rounded-lg bg-red-50 border border-red-200";
    if (!mistakeIds.includes(q.id)) mistakeIds.push(q.id); // 間違えたIDを記録
  }

  // 正解のテキストを組み立てて表示
  const correctText = correctAnswers.length === 0 
    ? "正解なし" 
    : correctAnswers.map(idx => `${idx + 1}. ${q.options[idx]}`).join(', ');
  document.getElementById('correct-answer-text').textContent = `正解： ${correctText}`;
}

// 次の問題へ
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

// 演習完了
function finishQuiz() {
  showScreen('quiz-result-screen');
  document.getElementById('final-score').textContent = `正解数： ${correctCount} / ${currentQuestions.length}`;
  
  const title = document.getElementById('result-title');
  const btnRetry = document.getElementById('btn-retry-mistakes');
  
  if (mistakeIds.length > 0) {
    title.textContent = "演習完了！";
    title.className = "text-2xl font-bold mb-4 text-gray-800";
    btnRetry.classList.remove('hidden'); // 復習ボタンを表示
  } else {
    title.textContent = "🎉 全問正解！カテゴリ達成！";
    title.className = "text-2xl font-bold mb-4 text-orange-500";
    btnRetry.classList.add('hidden');
  }
}

// ==========================================
// 初期化とイベント設定
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 事前学習データのセット
  document.getElementById('lesson-content').innerHTML = parseMarkdown(lessonText1);
  document.getElementById('lesson-content').addEventListener('click', (e) => {
    if (e.target.classList.contains('mask')) e.target.classList.toggle('revealed');
  });

  // タブイベント
  document.getElementById('tab-lesson').addEventListener('click', () => switchTab('lesson'));
  document.getElementById('tab-quiz').addEventListener('click', () => switchTab('quiz'));

  // クイズイベント
  document.getElementById('btn-start-normal').addEventListener('click', () => startQuiz(false));
  document.getElementById('btn-start-random').addEventListener('click', () => startQuiz(true));
  document.getElementById('btn-submit').addEventListener('click', submitAnswer);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);
  document.getElementById('btn-back-to-start').addEventListener('click', () => showScreen('quiz-start-screen'));
  
  // 間違えた問題のみで再スタート
  document.getElementById('btn-retry-mistakes').addEventListener('click', () => {
    const retryQuestions = questions1.filter(q => mistakeIds.includes(q.id));
    startQuiz(false, retryQuestions);
  });
});
