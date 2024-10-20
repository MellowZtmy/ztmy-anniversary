/**
 * 【定数設定】
 */

// 画面ロードした日時を取得
const globalToday = new Date();
// 画面表示モード、表示文字列、ページ
var DISPLAY = {};
// ソートモード
var SORTMODE = {
  MONTH_DAY: {
    code: 0,
    name: '記念日順',
  },
  YEAR_MONTH_DAY: {
    code: 1,
    name: '時系列順',
  },
};
// 設定ファイル情報
var appsettings = [];
// 全楽曲情報
var songsData = [];
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

    // 3. 画面表示モード、表示文字列、ページ
    DISPLAY = {
      MV: {
        mode: 0,
        name: 'MV',
        page: 1,
        data: songsData.filter(
          (row) =>
            row[appsettings.MVReleaseDateCol] !== appsettings.noDataString
        ),
        sortCol: appsettings.MVReleaseDateCol,
        sortMode: SORTMODE.MONTH_DAY.code,
        cardPerPage: appsettings.cardPerPageMV,
      },
      ALBUM: {
        mode: 1,
        name: 'ALBUM',
        page: 1,
        data: await fetchCsvData(
          appsettings.albumsFileName,
          appsettings.albumsSkipRowCount
        ),
        sortCol: appsettings.albumReleaseDateCol,
        sortMode: SORTMODE.MONTH_DAY.code,
        cardPerPage: appsettings.cardPerPageAlbum,
      },
      LIVE: {
        mode: 2,
        name: 'LIVE',
        page: 1,
        data: await fetchCsvData(
          appsettings.livesFileName,
          appsettings.liveSkipRowCount
        ),
        sortCol: appsettings.liveReleaseDateCol,
        sortMode: SORTMODE.MONTH_DAY.code,
        cardPerPage: appsettings.cardPerPageLive,
      },
    };

    // 4. カラーセット
    colorSets = await fetchCsvData(
      appsettings.colorSetsFileName,
      appsettings.colorSkipRowCount
    );

    // 開始画面を表示
    createDisplay(DISPLAY.MV.mode, 1, SORTMODE.MONTH_DAY.code);
  } catch (error) {
    // エラーハンドリング
    showError('Failed to load data:', error);
  }
});

// 画面タグ作成
function createDisplay(mode, page, sortMode) {
  // ページング、ソートモード保持
  for (let key in DISPLAY) {
    if (DISPLAY[key].mode === mode) {
      DISPLAY[key].page = page;
      DISPLAY[key].sortMode = sortMode;
      break;
    }
  }

  // 楽曲を日付順に並び変える
  var display = Object.values(DISPLAY).find((item) => item.mode === mode);
  var sortedData =
    sortMode === SORTMODE.MONTH_DAY.code
      ? sortByMonthDay(display.data, display.sortCol)
      : display.data;

  // 表示開始/終了index
  var listStartIndex = display.cardPerPage * (display.page - 1);
  var listEndIndex = listStartIndex + display.cardPerPage;

  // タグクリア
  $('#display').empty();

  // 変数初期化
  var tag = '';

  // 今日日付
  tag +=
    ' <p class="right-text date-text">TODAY：' +
    globalToday.toLocaleDateString('ja-JP').replace(/\./g, '/') +
    '</p>';

  // タブ
  tag += ' <div class="tab-content">';
  Object.values(DISPLAY).forEach(function (disp) {
    tag +=
      ' <div ' +
      (disp.mode !== display.mode
        ? 'onclick="createDisplay(' +
          disp.mode +
          ',' +
          disp.page +
          ',' +
          disp.sortMode +
          ')"'
        : '') +
      ' class="tab-item ' +
      (disp.mode === display.mode ? 'tab-selected' : 'tab-unselected') +
      '">' +
      disp.name +
      '</div>';
  });
  tag += ' </div>';

  // ソート作成
  tag += createSortTag(display.mode, display.page, display.sortMode);

  // ページング作成
  tag += createPagingTag(
    display.mode,
    display.page,
    sortedData.length,
    display.cardPerPage,
    display.sortMode
  );

  // タグ作成
  if (display.mode === DISPLAY.MV.mode) {
    //////////////////////////////////////////
    // MV情報
    //////////////////////////////////////////
    tag += '     <div class="card-list">';
    sortedData.slice(listStartIndex, listEndIndex).forEach(function (song) {
      // MV日付情報取得
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      const mvLeftDays = getDaysToNextMonthDay(MVReleaseDateStr);

      // カード生成
      tag += '      <div class="card-item" >';
      if (mvLeftDays == 0) {
        // 今日が記念日の場合
        tag +=
          '              <div class="card-name">今日は...<br>' +
          song[appsettings.songNameCol] +
          '<span class="highlight">' +
          getYearsToNextMonthDay(MVReleaseDateStr) +
          '</span>周年!!</div><br>';
      } else {
        tag +=
          '              <div class="card-name">' +
          song[appsettings.songNameCol] +
          '<br><span class="highlight">' +
          getYearsToNextMonthDay(MVReleaseDateStr) +
          '</span>周年まで</div>';
        tag +=
          '                  <div class="card-days">あと <span class="highlight">' +
          mvLeftDays +
          '</span>日</div>';
      }
      // MV Youtube表示
      tag += '            <div class="card-iframe-container">';
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
        '<div class="card-info-container">' +
        '<div class="card-info">作詞：' +
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
          '"class="album album">';
      }

      // ミニアルバム
      var minialbum = song[appsettings.minialbumCol];
      if (minialbum !== appsettings.noDataString) {
        tag +=
          '<img src="' +
          appsettings.albumImagePath +
          minialbum +
          '.jpg" alt="' +
          minialbum +
          '" class="album album">';
      }
      tag += '        </div>'; //album-container
      tag += '        </div>'; //card-info-container

      // MV公開年月日
      tag += '           <div class="card-date">' + MVReleaseDateStr + '</div>';

      tag += '        </div>'; //card-item
    });
    tag += '         </div>'; //card-list
  } else if (display.mode === DISPLAY.ALBUM.mode) {
    //////////////////////////////////////////
    // アルバム情報
    //////////////////////////////////////////
    tag += '     <div class="card-list">';
    sortedData.slice(listStartIndex, listEndIndex).forEach(function (album) {
      // アルバム日付情報取得
      const releaseDateStr = album[display.sortCol];
      const leftDays = getDaysToNextMonthDay(releaseDateStr);

      // 各カード生成
      tag += '      <div class="card-item" >';
      if (leftDays == 0) {
        // 今日が記念日の場合
        tag +=
          '              <div class="card-name">今日は...<br>' +
          album[2] +
          '<span class="highlight">' +
          getYearsToNextMonthDay(releaseDateStr) +
          '</span>周年!!</div><br>';
      } else {
        tag +=
          '              <div class="card-name">' +
          album[2] +
          '<br><span class="highlight">' +
          getYearsToNextMonthDay(releaseDateStr) +
          '</span>周年まで</div>';
        tag +=
          '                  <div class="card-days">あと <span class="highlight">' +
          leftDays +
          '</span>日</div>';
      }

      // Album ティザー Youtube表示
      if (album[9] !== appsettings.noDataString) {
        tag += '<div class="card-info">【ティザーPV】</div>';
        tag += '            <div class="card-iframe-container">';
        tag += '                 <iframe ';
        tag +=
          '                       src="https://www.youtube.com/embed/?loop=1&playlist=' +
          album[9] +
          '" frameborder="0" allowfullscreen>';
        tag += '                </iframe> ';
        tag += '             </div> ';
      }
      // ここまでAlbum ティザー Youtube表示

      // Album ティザー Youtube表示
      tag += '<div class="card-info">【プレイリスト】</div>';
      tag += '            <div class="card-iframe-container">';
      tag += '                 <iframe ';
      tag +=
        '                       src="https://www.youtube.com/embed/videoseries?list=' +
        album[5] +
        '" frameborder="0" allowfullscreen>';
      tag += '                </iframe> ';
      tag += '             </div> ';
      // ここまでAlbum ティザー Youtube表示

      // アルバム 情報
      tag += '<div class="card-info-container">';
      tag += '<div class="card-info">';
      album[6].split(appsettings.comma).forEach(function (song, index) {
        tag += (index + 1).toString().padStart(2, '0') + '. ' + song + '<br>';
      });
      tag += '</div>';

      // 画像
      tag += ' <div class="album-container">';
      // アルバム 画像
      tag +=
        '<img src="' +
        appsettings.albumImagePath +
        album[2] +
        '.jpg" alt="' +
        album[2] +
        '"class="album">';
      // ここまで アルバム 画像

      // 魔導書 画像
      tag +=
        '<img src="' +
        appsettings.grimoireImagePath +
        album[2] +
        '.jpg" alt="' +
        album[2] +
        '"class="album">';
      // ここまで 魔導書 画像
      tag += '        </div>'; //album-container

      tag += '        </div>'; //card-info-container

      // MV公開年月日
      tag += '           <div class="card-date">' + releaseDateStr + '</div>';

      tag += '        </div>'; //card-item
    });
    tag += '         </div>'; //card-list
  } else if (display.mode === DISPLAY.LIVE.mode) {
    //////////////////////////////////////////
    // ライブ情報
    //////////////////////////////////////////
    tag += '     <div class="card-list">';
    sortedData.slice(listStartIndex, listEndIndex).forEach(function (album) {
      // アルバム日付情報取得
      const releaseDateStr = album[display.sortCol];
      const leftDays = getDaysToNextMonthDay(releaseDateStr);

      // 各カード生成
      tag += '      <div class="card-item" >';
      if (leftDays == 0) {
        // 今日が記念日の場合
        tag +=
          '              <div class="card-name">今日は...<br>' +
          album[2] +
          '<span class="highlight">' +
          getYearsToNextMonthDay(releaseDateStr) +
          '</span>周年!!</div><br>';
      } else {
        tag +=
          '              <div class="card-name">' +
          album[2] +
          '<br><span class="highlight">' +
          getYearsToNextMonthDay(releaseDateStr) +
          '</span>周年まで</div>';
        tag +=
          '                  <div class="card-days">あと <span class="highlight">' +
          leftDays +
          '</span>日</div>';
      }

      // Album ティザー Youtube表示
      if (album[9] !== appsettings.noDataString) {
        tag += '<div class="card-info">【ティザーPV】</div>';
        tag += '            <div class="card-iframe-container">';
        tag += '                 <iframe ';
        tag +=
          '                       src="https://www.youtube.com/embed/?loop=1&playlist=' +
          album[9] +
          '" frameborder="0" allowfullscreen>';
        tag += '                </iframe> ';
        tag += '             </div> ';
      }
      // ここまでAlbum ティザー Youtube表示

      // Album ティザー Youtube表示
      tag += '<div class="card-info">【プレイリスト】</div>';
      tag += '            <div class="card-iframe-container">';
      tag += '                 <iframe ';
      tag +=
        '                       src="https://www.youtube.com/embed/videoseries?list=' +
        album[5] +
        '" frameborder="0" allowfullscreen>';
      tag += '                </iframe> ';
      tag += '             </div> ';
      // ここまでAlbum ティザー Youtube表示

      // アルバム 情報
      tag += '<div class="card-info-container">';
      tag += '<div class="card-info">';
      album[6].split(appsettings.comma).forEach(function (song, index) {
        tag += (index + 1).toString().padStart(2, '0') + '. ' + song + '<br>';
      });
      tag += '</div>';

      // 画像
      tag += ' <div class="album-container">';
      // アルバム 画像
      tag +=
        '<img src="' +
        appsettings.albumImagePath +
        album[2] +
        '.jpg" alt="' +
        album[2] +
        '"class="album">';
      // ここまで アルバム 画像

      // 魔導書 画像
      tag +=
        '<img src="' +
        appsettings.grimoireImagePath +
        album[2] +
        '.jpg" alt="' +
        album[2] +
        '"class="album">';
      // ここまで 魔導書 画像
      tag += '        </div>'; //album-container

      tag += '        </div>'; //card-info-container

      // MV公開年月日
      tag += '           <div class="card-date">' + releaseDateStr + '</div>';

      tag += '        </div>'; //card-item
    });
    tag += '         </div>'; //card-list
  }

  // ページング作成
  tag += createPagingTag(
    display.mode,
    display.page,
    sortedData.length,
    display.cardPerPage,
    display.sortMode
  );

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" style="cursor: pointer;" onclick="changeColor(1)">Color ↺</h2>';

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // 画像拡大設定
  addEnlargeImageEvent();
}
