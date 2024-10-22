// JSONデータを取得する関数
function getJsonData(jsonUrl) {
  return new Promise((resolve, reject) => {
    $.getJSON(jsonUrl, function (data) {
      resolve(data);
    }).fail(function () {
      reject('Failed to load JSON file');
    });
  });
}

// CSVデータを取得する関数
async function fetchCsvData(fileName, skipRowCount = 0) {
  try {
    const response = await fetch(fileName);
    const text = await response.text();
    return parseCsv(text, skipRowCount);
  } catch (error) {
    throw new Error('Failed to load CSV file:' + fileName);
  }
}

// CSVデータをパースする関数（csvデータ内の「,」は「，」にしているため「,」に変換して返却）
function parseCsv(csvText, skipRowCount) {
  var regx = new RegExp(appsettings.commaInString, 'g');
  return csvText
    .trim()
    .split(/\r?\n|\r/)
    .slice(skipRowCount)
    .map((line) => line.split(',').map((value) => value.replace(regx, ',')));
}

// データをローカルストレージにセットする関数
function setLocal(key, value) {
  localStorage.setItem(key, value);
}

// ローカルストレージからデータをゲットする関数
function getLocal(key) {
  return localStorage.getItem(key);
}

// ローカルストレージから配列を取得(nullは空に)
function getLocalArray(name) {
  return JSON.parse(localStorage.getItem(name)) ?? [];
}

// ローカルストレージに配列設定(nullは空に)
function setLocalArray(name, array) {
  localStorage.setItem(name, JSON.stringify(array ?? []));
}

// エラー時処理
function showError(errorMsg1, errorMsg2) {
  // コンソールに表示
  console.error(errorMsg1, errorMsg2);
  // 画面に表示
  alert(errorMsg2);
}

// カラーチェンジ
function changeColor(plusCount) {
  // 今のカラーインデックスを取得し、次のインデックス設定
  var colorIndex = Number(getLocal('colorIndex') ?? 2) + plusCount;
  // 設定するカラーを設定（ない場合最初に戻る）
  var colorSet = colorSets[colorIndex] ?? colorSets[0];
  $('body').css({
    background: colorSet[1],
    color: colorSet[2],
  });
  $('.btn--main').css({
    'background-color': colorSet[3],
    color: colorSet[4],
  });
  // 今のカラー設定をローカルストレージに保存
  var colorIndexNow = colorSets[colorIndex] ? colorIndex : 0;
  setLocal('colorIndex', colorIndexNow);
  // 今のカラー表示
  $('#changeColor').html(
    'Color ↺ <br>(' + (colorIndexNow + 1) + '/' + colorSets.length + ')'
  );
}

// 未来日までの日数取得
function getDaysToNextMonthDay(pastDateString) {
  const today = new Date(globalToday.setHours(0, 0, 0, 0));
  const [, month, day] = pastDateString.split('/').map(Number);

  let nextDate = new Date(today.getFullYear(), month - 1, day);
  if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);

  return Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
}

// 未来日までの年数取得
function getYearsToNextMonthDay(pastDateString) {
  const today = globalToday;
  const [year, month, day] = pastDateString.split('/').map(Number);

  return (
    today.getFullYear() -
    year +
    (new Date(today.getFullYear(), month - 1, day) < today ? 1 : 0)
  );
}

// 二次元配列を月日でソート
function sortByMonthDay(arr, sortColIndex) {
  const today = new Date(globalToday.setHours(0, 0, 0, 0));

  function daysToToday(dateString) {
    const [, month, day] = dateString.split('/').map(Number);
    const date = new Date(today.getFullYear(), month - 1, day);
    if (date < today) date.setFullYear(today.getFullYear() + 1);
    return (date - today) / (1000 * 60 * 60 * 24);
  }

  // 配列のコピーを作成
  const arrCopy = [...arr];

  // コピーをソート
  return arrCopy.sort(
    (a, b) => daysToToday(a[sortColIndex]) - daysToToday(b[sortColIndex])
  );
}

// ソートタグ作成
function createSortTag(currentMode, currentPage, currentSortMode) {
  // 変数初期化
  var tag = '';

  // タグ生成
  // ソートタグ生成
  tag += '<div class="sort">';
  Object.values(SORTMODE).forEach(function (sortMode) {
    tag +=
      ' <a class="' +
      (sortMode.code === currentSortMode ? 'disabled' : 'active') +
      '" onclick="createDisplay(' +
      currentMode +
      ',' +
      currentPage +
      ',' +
      sortMode.code +
      ')" class="tab-item ' +
      (sortMode.code === currentSortMode ? 'tab-selected' : 'tab-unselected') +
      '">' +
      sortMode.name +
      '</a>';
  });
  tag += '</div>';

  return tag;
}

// ページングタグ作成
function createPagingTag(
  currentMode,
  currentPage,
  listLength,
  cardPerPage,
  sortMode
) {
  // 変数初期化
  var tag = '';
  var pageIndex = 0;

  // タグ生成
  tag += '<div class="pagination">';

  // 設定ファイルの「1ページ当たり表示数」分行ループ
  for (let i = 0; i < listLength; i += cardPerPage) {
    pageIndex++;
    tag +=
      ' <a class="' +
      (currentPage === pageIndex ? 'disabled' : 'active') +
      '" onclick="createDisplay(' +
      currentMode +
      ',' +
      pageIndex +
      ',' +
      sortMode +
      ')">' +
      pageIndex +
      '</a>';
  }

  tag += '</div>';

  return tag;
}

// Youtubeタグ作成
function createYoutubeTag(id, isPlayList) {
  // 変数初期化
  var tag = '';

  // タグ生成
  tag += '<div class="card-iframe-container">';
  tag +=
    '        <iframe src="https://www.youtube.com/embed/' +
    (isPlayList ? 'videoseries?list=' : '?loop=1&playlist=') +
    id +
    '&mute=1" frameborder="0" allowfullscreen>';
  tag += '   </iframe> ';
  tag += '</div> ';

  return tag;
}

// 画像クリックイベント追加
function addEnlargeImageEvent() {
  // 拡大表示用の要素を取得
  const overlay = document.getElementById('overlay');
  const overlayImage = overlay.querySelector('img');

  // すべてのimgタグにクリックイベントを追加
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('click', () => {
      overlay.classList.add('active');
      overlayImage.src = image.src;
    });
  });

  // オーバーレイをクリックすると閉じる
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    overlayImage.src = ''; // フェードアウト後に画像をクリア
  });
}

// CSSルール作成
function addCssRule(selector, cssRules, imagePath) {
  // CSSルール作成
  var rule =
    ' .card-item.' +
    selector +
    '::before { background-image: url(../' +
    imagePath +
    selector +
    '.jpg); } ';

  // CSSルールにまだない場合
  if (!cssRules.includes(rule)) {
    // CSSルール追加
    cssRules.push(rule);
  }

  return cssRules;
}
