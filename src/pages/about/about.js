import '../../modules/fetch';

async function init() {
  console.log('initialize')
}

// DOM 読み込み直後に実行
$(function () {
  init();
});

// Object.assign(window);
