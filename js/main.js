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

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';

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
    tag += ' <h2 class="h2-display">MV</h2>';
    tag += '     <div class="mv-list">';
    sortedMvsData.forEach(function (song) {
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
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
        getDaysToNextMonthDay(MVReleaseDateStr) +
        '</span>日</div>';
      // MV表示
      tag += '    <!--MV Youtube--> ';
      tag += '            <div class="margin-top-20" id="mv"> ';
      tag += '              <div style="position: relative; width: 100%;"> ';
      tag += '                 <iframe ';
      tag +=
        '                       src="https://www.youtube.com/embed/' +
        song[appsettings.mvIdCol] +
        '?loop=1&playlist=' +
        song[appsettings.mvIdCol] +
        '" ';
      tag += '                  frameborder="0" ';
      tag += '                  width="100%" ';
      tag += '                  height="100%" ';
      tag +=
        '                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ';
      tag += '                  allowfullscreen="" ';
      tag += '                  data-gtm-yt-inspected-32118529_704="true">';
      tag += '                </iframe> ';
      tag += '             </div> ';
      tag += '           </div> ';
      // ここまでMV
      tag += '           <div class="mv-date">' + MVReleaseDateStr + '</div>';
      tag += '        </div>';
    });
    tag += '         </div>';
  }
  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // displaymode
  currentDisplay = mode;
}
