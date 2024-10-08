/**
 * 【定数設定】
 */
// 画面表示モード、表示文字列、ページ
var DISPLAY = {
  MV: { code: 0, name: 'MV', page: 1 },
  ALBUM: { code: 1, name: 'Album', page: 1 },
  LIVE: { code: 2, name: 'Live', page: 1 },
};
// 画面ロードした日時を取得
const globalToday = new Date();
// 設定ファイル情報
var appsettings = [];
// 全楽曲情報
var songsData = [];
// MV曲情報
var mvsData = [];
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
    createDisplay(DISPLAY.MV.code, 1);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load data:', error);
  }
});

// 画面タグ作成
function createDisplay(mode, page) {
  // 楽曲を日付順に並び変える TODO アルバムに対応
  var sortedMvsData = sortByMonthDay(mvsData, appsettings.MVReleaseDateCol);

  // 表示開始/終了index
  var listStartIndex = appsettings.cardPerPage * (page - 1);
  var listEndIndex = listStartIndex + appsettings.cardPerPage;

  // タグクリア
  $('#display').empty();

  // 変数初期化
  var tag = '';

  // 今日日付
  tag +=
    ' <p class="right-text date-text">TODAY：' +
    globalToday.toLocaleDateString('ja-JP').replace(/\./g, '/') +
    '</p>';

  // タイトル
  tag += ' <div class="tab-content">';
  Object.values(DISPLAY).forEach(function (display) {
    tag +=
      ' <div onclick="createDisplay(' +
      display.code +
      ',' +
      display.page +
      ')" class="tab-item ' +
      (display.code === mode ? 'tab-selected' : 'tab-unselected') +
      '">' +
      display.name +
      '</div>';
  });
  tag += ' </div>';

  // ページング作成 TODO アルバムに対応
  tag += createPagingTag(mode, page, sortedMvsData.length);

  // タグ作成
  if (mode === DISPLAY.MV.code) {
    //////////////////////////////////////////
    // MV情報
    //////////////////////////////////////////
    tag += '     <div class="mv-list">';
    sortedMvsData.slice(listStartIndex, listEndIndex).forEach(function (song) {
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
  }

  // ページング作成 TODO アルバムに対応
  tag += createPagingTag(mode, page, sortedMvsData.length);

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // ページング保持
  for (let key in DISPLAY) {
    if (DISPLAY[key].code === mode) {
      DISPLAY[key].page = page;
      break;
    }
  }
}
