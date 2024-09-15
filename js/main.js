/**
 * 【定数設定】
 */
// 画面表示モード
const display = {
  PAST: 1,
  FUTURE: 2,
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
    createDisplay(display.FUTURE);
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

  // タグ作成
  if (mode === display.PAST) {
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
  } else if (mode === display.FUTURE) {
    // 楽曲を日付順に並び変える
    var sortedMvsData = sortByMonthDay(mvsData);
    // 未来情報描画
    tag += ' <h2 class="h2-display">Future</h2>';
    tag += '     <table class="table-game" border="1">';
    tag += '         <tbody>';
    sortedMvsData.forEach(function (song) {
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      // table各行生成
      tag += '             <tr>';
      tag +=
        ' <td>' +
        song[appsettings.songNameCol] +
        '<br>' +
        getYearsToNextMonthDay(MVReleaseDateStr) +
        '周年まで</td>';
      tag += ' <td>あと ' + getDaysToNextMonthDay(MVReleaseDateStr) + '日</td>';
      tag += ' <td>' + MVReleaseDateStr + '</td>';
      tag += '             </tr>';
    });
    tag += '         </tbody>';
    tag += '     </table>';
    tag +=
      ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';
  }
  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // displaymode
  currentDisplay = mode;
}
