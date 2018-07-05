
'use strict';


let data = null;
let idx = null;
let errorReport = null;
let LocalForage = window.localforage;
let fav = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
let categories = ['A1', 'A2', 'A3', 'A4', 'S1', 'S2', 'S3', 'S4', 'C1', 'C2', 'I', 'O'];

let skipA2HS = () => { $('.mdl__loader.non-standalone').transition('fade out'); };
let clickTab = (tabId) => { $(tabId).find('span').click(); };

function checkDeferredPrompt() {
  if (deferredPrompt !== null) {
    $('#installPromptTooltip').remove();
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'dismissed') {
        showMsg('Installation cancelled. You can still manually install by tapping' +
          ' "Add to Home Screen" option in your browser\'s menu.', () => {}, 'OK', 10000);
      } else {
        alert('NT18 OnAir successfully installed.');
      }
    });
  }
}

function showMsg(message, actionHandler = () => {}, actionText = 'OK', timeout = 3000) {
  let sb = $('#msgContainer')[0].MaterialSnackbar;
  sb.showSnackbar({
    message: message,
    timeout: timeout,
    actionHandler: () => { actionHandler(); sb.hideSnackbar(); },
    actionText: actionText
  });
}

function init() {

  /* Init all components and functions */

  $.ajaxSetup({
    error: (xhr, status, exception) => {
      errorReport = `mailto:accel@pku.edu.cn?subject=NT18 OnAir Bug&body=status:${status}; exception:${exception}`;
      setTimeout(() => {
        showMsg('Load error.', () => {
          location.href = errorReport;
        }, 'Report');
      }, 3000);
    }
  });

  $('#home-partial').load('partial/home-partial.html');
  $('#schedule').load('partial/schedule-partial.html', () => {
    $('#schedule-partial').click((e) => {
      let $target = $(e.target), $arrow = $target.prev().children(':first'), $next = $target.parent().next();
      if (!$target.hasClass('mdl-button__ripple-container')) return false;
      let rotate = parseInt($arrow.attr('data-rotate')) || 0; // 0 or 1
      $arrow.attr('data-rotate', 1 - rotate);
      $({ deg: rotate * 180 }).animate({ deg: (1 - rotate) * 180 }, {
        duration: 200,
        easing: 'swing',
        step: (now) => {
          $arrow.css('transform', `rotate(${now}deg)`);
        }
      });
      $next.toggleClass('hidden');
    })
  });

  $.getJSON('data/abstracts.json', function (data_) {
    data = data_;
  });

  $.getJSON('data/abstracts-indexed.json', function (data_) {
    idx = lunr.Index.load(data_);
  });

  LocalForage.config({
    driver: [LocalForage.INDEXEDDB, LocalForage.WEBSQL, LocalForage.LOCALSTORAGE],
    name: 'NT18 OnAir'
  });

  LocalForage.getItem('favorites', function (err, val) {
    if (val === null) {
      LocalForage.setItem('favorites', fav);
    } else {
      fav = val;
    }
  });

  addSearchHandler();

  componentHandler.upgradeAllRegistered();

}

