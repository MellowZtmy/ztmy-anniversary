/**
 * 【定数設定】
 */
// 画面表示モード、表示文字列
const display = {
  MV: 'MV',
};
// 画面ロードした日時を取得
const globalToday = new Date();
// 設定ファイル情報
var appsettings = [];
// 全楽曲情報
var songsData = [];
// MV曲情報
var mvsData = [];
// MV現在ページ
var mvCurrentPage = 1;
// アルバム現在ページ
var albumCurrentPage = 1;
// カラーセット
var colorSets = [];

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
    createDisplay(display.MV);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load data:', error);
  }
});

// 画面タグ作成
function createDisplay(mode) {
  // 楽曲を日付順に並び変える TODO アルバムに対応
  var sortedMvsData = sortByMonthDay(mvsData, appsettings.MVReleaseDateCol);

  // タグクリア
  $('#display').empty();

  // 変数初期化
  var tag = '';

  // 今日日付
  tag +=
    ' <p class="right-text date-text">TODAY：' +
    globalToday.toLocaleDateString('ja-JP').replace(/\./g, '/') +
    '</p>';

  // タイトル TODO アルバムに対応
  tag += ' <h2 class="h2-display">' + mode + '</h2>';

  // ページング作成 TODO アルバムに対応
  tag += createPagingTag(mvCurrentPage, sortedMvsData);

  // タグ作成
  if (mode === display.MV) {
    //////////////////////////////////////////
    // MV情報
    //////////////////////////////////////////
    // MV情報描画
    tag += '     <div class="mv-list">';
    sortedMvsData.forEach(function (song, index) {
      // ページング表示
      if (index >= appsettings.cardPerPage) {
        return;
      }

      // MV日付情報取得
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      const mvLeftDays = getDaysToNextMonthDay(MVReleaseDateStr);

      // 各MV生成
      tag += '      <div name="mv" class="mv-item" >';
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
      // MV Youtube表示
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
      // ここまでMV Youtube

      // MV 情報
      tag +=
        '<div class="mv-info-container">' +
        '<div class="mv-info">作詞：' +
        song[appsettings.writerCol] +
        '<br>作曲：' +
        song[appsettings.composerCol] +
        '<br>編曲：' +
        song[appsettings.arrangerCol] +
        '<br>監督：' +
        song[appsettings.mvDirectorCol] +
        '</div>';

      // アルバム
      tag += ' <div class="album-container">';
      var album = song[appsettings.albumCol];
      if (album !== appsettings.noDataString) {
        tag +=
          '<img src="' +
          appsettings.albumImagePath +
          album +
          '.jpg" alt="' +
          album +
          '"class="album">';
      }

      // ミニアルバム
      var minialbum = song[appsettings.minialbumCol];
      if (minialbum !== appsettings.noDataString) {
        tag +=
          '<img src="' +
          appsettings.minialbumImagePath +
          minialbum +
          '.jpg" alt="' +
          minialbum +
          '" class="album">';
      }
      tag += '        </div>'; //mv-info
      tag += '        </div>'; //mv-info-container

      // MV公開年月日
      tag += '           <div class="mv-date">' + MVReleaseDateStr + '</div>';

      tag += '        </div>'; //mv-item
    });
    tag += '         </div>'; //mv-list
    //////////////////////////////////////////
    // アルバム
    //////////////////////////////////////////
  }

  // ページング作成 TODO アルバムに対応
  tag += createPagingTag(mvCurrentPage, sortedMvsData);

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);
}
