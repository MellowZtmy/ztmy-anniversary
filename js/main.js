/**
 * 【定数設定】
 */
// 画面表示モード
const display = {
  PAST: 1,
};
// 設定ファイル情報
var appsettings = [];
// 楽曲ファイル情報
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
    songsData = await fetchCsvData(appsettings.songsFileName, 4);

    // 3. カラーセット読み込み
    colorSets = await fetchCsvData(appsettings.colorSetsFileName, 1);

    // 5. 開始画面を表示
    createDisplay(display.PAST);
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
    tag += '         <thead>';
    tag += '             <tr>';
    tag += '                 <th>曲</th>';
    tag += '                 <th>MV公開日</th>';
    tag += '                 <th>公開から</th>';
    // tag += '                 <th>何年何か月</th>';
    tag += '             </tr>';
    tag += '         </thead>';
    tag += '         <tbody>';
    songsData.forEach(function (song) {
      const MVReleaseDateStr = song[appsettings.MVReleaseDateCol];
      if (MVReleaseDateStr !== appsettings.noDataString) {
        // 入力された日付と現在の日付をDateオブジェクトに変換
        const MVReleaseDate = new Date(MVReleaseDateStr);
        const todayDate = new Date();

        // // 年と月の差分を計算
        // let years = todayDate.getFullYear() - MVReleaseDate.getFullYear();
        // let months = todayDate.getMonth() - MVReleaseDate.getMonth();

        // // 月数の差がマイナスの場合の補正
        // if (months < 0) {
        //   years--;
        //   months += 12;
        // }
        // table各行生成
        tag += '             <tr>';
        tag += ' <td>' + song[appsettings.songNameCol] + '</td>';
        tag += ' <td>' + MVReleaseDateStr + '</td>';
        tag +=
          ' <td> ' +
          Math.floor((todayDate - MVReleaseDate) / (1000 * 60 * 60 * 24)) +
          '日</td>';
        // tag += ' <td>' + `${years}年 ${months}か月` + '</td>';
        tag += '             </tr>';
      }
    });
    tag += '         </tbody>';
    tag += '     </table>';
    tag +=
      ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';
    // // 選択中アルバム設定
    // selectedAlbums = getLocalArray('selectedAlbums');
    // selectedMinialbums = getLocalArray('selectedMinialbums');
    // // アルバム、ミニアルバムリストより出題する曲リスト取得
    // selectedSongIndex = getSelectedSongIndex();
    // tag += ' <h2 class="h2-display">Albums</h2>';
    // albums.forEach(function (album, index) {
    //   tag +=
    //     ' <img src="' +
    //     appsettings.albumImagePath +
    //     +(index + 1) +
    //     '_' +
    //     album +
    //     '.jpg" id="' +
    //     album +
    //     '" name="album" alt="' +
    //     album +
    //     '" class="album' +
    //     (selectedAlbums.includes(album) ? '' : ' darkened') +
    //     '" onclick="clickAlbum(this)">';
    // });
    // tag += ' <h2 class="h2-display">Minialbums</h2>';
    // minialbums.forEach(function (album, index) {
    //   tag +=
    //     ' <img src="' +
    //     appsettings.minialbumImagePath +
    //     (index + 1) +
    //     '_' +
    //     album +
    //     '.jpg" id="' +
    //     album +
    //     '" name="minialbum" alt="' +
    //     album +
    //     '" class="album' +
    //     (selectedMinialbums.includes(album) ? '' : ' darkened') +
    //     '" onclick="clickAlbum(this)">';
    // });
    // tag +=
    //   ' <h2 class="center-text margin-top-20" id="songCount">' +
    //   selectedSongIndex.length +
    //   ' Songs</h2>';
    // tag += '<button id="start"';
    // tag += '  onclick="loadQuiz(true)"';
    // tag += '  class="btn btn--main btn--radius btn--cubic bottom-button"';
    // tag += '>';
    // tag += '  START';
    // tag += '</button>';
    // tag +=
    //   ' <h2 id="changeColor" class="center-text margin-top-20" onclick="changeColor(1)">Color ↺</h2>';
    // // 紙吹雪解除
    // $('canvas')?.remove();
  }
  // タグ流し込み
  $('#display').append(tag);

  // CSS適用
  changeColor(0);
}
