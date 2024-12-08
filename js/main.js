/**
 * 【定数設定】
 */

// 画面ロードした日時を取得
const globalToday = new Date();
// 画面表示モード、表示文字列、ページ
var DISPLAY = {};
// ソート順
var SORTORDER = {
  asc: true,
  desc: false,
};
// ソートモード
var SORTMODE = {
  ANNIVERSARY: {
    code: 0,
    name: '記念日順',
    defaultSortOrder: SORTORDER.asc,
  },
  HISTORY: {
    code: 1,
    name: '時系列順',
    defaultSortOrder: SORTORDER.desc,
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
        sortMode: SORTMODE.ANNIVERSARY.code,
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
        sortMode: SORTMODE.ANNIVERSARY.code,
        cardPerPage: appsettings.cardPerPageAlbum,
      },
      // LIVE: {
      //   mode: 2,
      //   name: 'LIVE',
      //   page: 1,
      //   data: await fetchCsvData(
      //     appsettings.livesFileName,
      //     appsettings.liveSkipRowCount
      //   ),
      //   sortCol: appsettings.liveReleaseDateCol,
      //   sortMode: SORTMODE.ANNIVERSARY.code,
      //   cardPerPage: appsettings.cardPerPageLive,
      // },
    };

    // 4. カラーセット
    colorSets = await fetchCsvData(
      appsettings.colorSetsFileName,
      appsettings.colorSkipRowCount
    );

    // 開始画面を表示
    createDisplay(DISPLAY.MV.mode, 1, SORTMODE.ANNIVERSARY.code);
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

  // スタイルシートを取得(背景画像設定用)
  const styleSheet = document.styleSheets[0];
  var cssRules = [];

  // 楽曲を日付順に並び変える
  var display = Object.values(DISPLAY).find((item) => item.mode === mode);
  var sortedData =
    sortMode === SORTMODE.ANNIVERSARY.code
      ? // 記念日順の場合 今日に近い未来の日付昇順
        sortByMonthDay(
          display.data,
          display.sortCol,
          SORTMODE.ANNIVERSARY.defaultSortOrder
        )
      : // 時系列順の場合 今日に近い未来の日付昇順
        sortByYearMonthDay(
          display.data,
          display.sortCol,
          SORTMODE.HISTORY.defaultSortOrder
        );

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
          ',1,' +
          SORTMODE.ANNIVERSARY.code +
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
  tag += createSortTag(display);

  // ページング作成
  tag += createPagingTag(display);

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

      // アルバム画像名取得
      var imageName =
        song[appsettings.minialbumCol] !== appsettings.noDataString
          ? song[appsettings.minialbumCol]
          : song[appsettings.albumCol];

      // 背景画像設定(ミニアルバム優先,すでにあるものは追加しない)
      addCssRule(imageName, cssRules, appsettings.albumImagePath);

      // カード生成
      tag += '      <div class="card-item ' + imageName + '">';
      tag += createCardTitleTag(
        mvLeftDays,
        MVReleaseDateStr,
        song[appsettings.songNameCol],
        display.sortMode,
        '公開'
      );

      // MV Youtube表示
      tag += createYoutubeTag(song[appsettings.mvIdCol], false);
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

      // 背景画像設定CSSルール追加(すでにあるものは追加しない)
      addCssRule(album[2], cssRules, appsettings.grimoireImagePath);

      // カード生成
      tag += '      <div class="card-item ' + album[2] + '">';
      tag += createCardTitleTag(
        leftDays,
        releaseDateStr,
        album[2],
        display.sortMode,
        '発売'
      );

      // Album ティザー Youtube表示
      if (album[9] !== appsettings.noDataString) {
        tag += '<div class="card-info">【ティザーPV】</div>';
        tag += createYoutubeTag(album[9], false);
      }
      // ここまでAlbum ティザー Youtube表示

      // Album ティザー Youtube表示
      tag += '<div class="card-info">【プレイリスト】</div>';
      tag += createYoutubeTag(album[5], true);
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
    sortedData.slice(listStartIndex, listEndIndex).forEach(function (live) {
      // ライブ日付情報取得
      const releaseDateStr = live[display.sortCol];
      const leftDays = getDaysToNextMonthDay(releaseDateStr);

      // 各カード生成
      tag += '      <div class="card-item" >';
      tag += createCardTitleTag(
        leftDays,
        releaseDateStr,
        live[2],
        display.sortMode
      );

      // ライブ 情報
      tag += '<div class="card-info-container">';
      // セトリ
      tag += '   <div class="card-info">【セットリスト】<br>';
      live[4].split(appsettings.comma).forEach(function (song, index) {
        tag += (index + 1).toString().padStart(2, '0') + '. ' + song + '<br>';
      });

      // アンコール
      if (live[5] !== appsettings.noDataString) {
        tag += '--------Encore--------<br>';
        live[5].split(appsettings.comma).forEach(function (song, index) {
          tag += (index + 1).toString().padStart(2, '0') + '. ' + song + '<br>';
        });
      }
      tag += '   </div>';
      tag += '</div>'; //card-info-container

      // MV公開年月日
      tag += '           <div class="card-date">' + releaseDateStr + '</div>';

      tag += '        </div>'; //card-item
    });
    tag += '         </div>'; //card-list
  }
  // 敬称略
  tag += '<div class="right-text">※敬称略</div>';

  // ページング作成
  tag += createPagingTag(display);

  // カラーチェンジ
  tag +=
    ' <h2 id="changeColor" class="center-text margin-top-20" style="cursor: pointer;" onclick="changeColor(1)">Color ↺</h2>';

  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);

  // 背景画像のcss設定
  cssRules.forEach((rule) =>
    styleSheet.insertRule(rule, styleSheet.cssRules.length)
  );

  // 画像拡大設定
  addEnlargeImageEvent();
}
