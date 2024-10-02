/**
 * 【定数設定】
 */
// 画面表示モード
const display = {
  TOP: 1,
};
// 設定ファイル情報
var appsettings = [];
// 全楽曲情報
var songsData = [];
// MV曲情報
var mvsData = [];
// カラーセット
var colorSets = [];
// 画面表示モード
var currentDisplay;

/**
 * 【イベント処理】
 */
// 1. 画面表示
$(document).ready(async function () {
  try {
    // 1. 設定ファイル読み込み
    appsettings = await getJsonData('appsettings.json');

    // 2. 楽曲情報読み込み
    songsData = await fetchCsvData(
      appsettings.songsFileName,
      appsettings.songSkipRowCount
    );
    mvsData = songsData.filter(
      (row) => row[appsettings.MVReleaseDateCol] !== appsettings.noDataString
    );

    // 3. カラーセット読み込み
    colorSets = await fetchCsvData(
      appsettings.colorSetsFileName,
      appsettings.colorSkipRowCount
    );

    // 5. 開始画面を表示
    createDisplay(display.TOP);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load data:', error);
  }
});

// 画面タグ作成
function createDisplay(mode) {
  // タグクリア
  $('#display').empty();

  // 変数初期化
  var tag = '';

  // 今日日付
  tag +=
    ' <p class="right-text date-text">TODAY：' +
    new Date().toLocaleDateString('ja-JP').replace(/\./g, '/') +
    '</p>';

  // タグ作成
  if (mode === display.TOP) {
    // 楽曲を日付順に並び変える
    var sortedMvsData = sortByMonthDay(mvsData);
    // 未来情報描画
    tag += ' <h2 class="h2-display">MV</h2>';
    tag += '     <div class="mv-list">';
    sortedMvsData.forEach(function (song, index) {
      // MV日付情報取得
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      const mvLeftDays = getDaysToNextMonthDay(MVReleaseDateStr);
      // N個まで表示
      if (index >= appsettings.cardPerPage) {
        return;
      }
      // table各行生成
      tag += '      <div class="mv-item">';
      tag +=
        '              <div class="mv-name">' +
        song[appsettings.songNameCol] +
        '<br><span class="highlight">' +
        getYearsToNextMonthDay(MVReleaseDateStr) +
        '</span>周年まで</div>';
      tag +=
        '                  <div class="mv-days">あと <span class="highlight">' +
        mvLeftDays +
        '</span>日</div>';
      // MV表示
      tag += '            <!--MV Youtube--> ';
      tag += '            <div class="mv-iframe-container">';
      tag += '                 <iframe ';
      tag +=
        '                       src="https://www.youtube.com/embed/' +
        song[appsettings.mvIdCol] +
        '?loop=1&playlist=' +
        song[appsettings.mvIdCol] +
        '" frameborder="0" allowfullscreen>';
      tag += '                </iframe> ';
      tag += '             </div> ';
      // ここまでMV

      tag +=
        '              <div class="mv-info">作詞：' +
        song[appsettings.writerCol] +
        '<br>作曲：' +
        song[appsettings.composerCol] +
        '<br>編曲：' +
        song[appsettings.arrangerCol] +
        '<br>監督：' +
        song[appsettings.mvDirectorCol] +
        '</div>';
      tag += '           <div class="mv-date">' + MVReleaseDateStr + '</div>';
      tag += '        </div>';
    });
    tag += '         </div>';

    // 過去情報描画
    tag += ' <h2 class="h2-display">Past</h2>';
    tag += '     <table class="table-game" border="1">';
    tag += '         <tbody>';
    mvsData.forEach(function (song) {
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      // 入力された日付と現在の日付をDateオブジェクトに変換
      const MVReleaseDate = new Date(MVReleaseDateStr);
      const todayDate = new Date();

      // table各行生成
      tag += '             <tr>';
      tag += ' <td>' + song[appsettings.songNameCol];
      tag += '<br>';
      tag += 'MV公開から</td>';
      tag +=
        ' <td> ' +
        Math.floor((todayDate - MVReleaseDate) / (1000 * 60 * 60 * 24)) +
        '日</td>';
      tag += ' <td>' + MVReleaseDateStr + '</td>';
      tag += '             </tr>';
    });
    tag += '         </tbody>';
    tag += '     </table>';
    tag +=
      ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';
  }

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';

  //バージョン情報
  //tag += ' <p class="right-text">' + appsettings.version + '</p>';

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // displaymode
  currentDisplay = mode;
}
