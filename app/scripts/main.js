
'use strict';


let data = null;
let idx = null;
let errorReport = null;
let fav = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
let isPhone = /Android|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);

let skipA2HS = () => { $('.mdl__loader.non-standalone').transition('fade out'); };
let clickTab = (tabId) => { $(tabId).find('span').click(); };
let scrollToTop = () => {
  $('.mdl-layout').stop().animate({ scrollTop: 0 }); // for desktop
  $('.mdl-layout__content').stop().animate({ scrollTop: 0 });
};

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

function toggleArrowRotation($arrow) {

  /* $arrow should be $('<i class="material-icons ...">expand_less</i>') */

  let rotate = parseInt($arrow.attr('data-rotate')) || 0; // 0 or 1. Didn't explicitly declare this (unimportant) attr
  $arrow.attr('data-rotate', 1 - rotate);
  $({ deg: rotate * 180 }).animate({ deg: (1 - rotate) * 180 }, {
    duration: 200,
    easing: 'swing',
    step: (now) => { $arrow.css('transform', `rotate(${now}deg)`); }
  });
}


function init() {

  $.ajaxSetup({
    error: (xhr, status, exception) => {
      errorReport = `mailto:accel@pku.edu.cn?subject=Bug Report&body=status:${status}; exception:${exception}`;
      setTimeout(() => {
        showMsg('Load error.', () => { location.href = errorReport; }, 'Report');
      }, 3000);
    }
  });

  if (isMobile) {
    $('head').append('<style>.mdl-button:not(.mdl-button--fab):hover{background:none!important;}</style>');
  }
  if (isPhone) {
    let $stBtn = $('#scrollTopButton');
    $('.mdl-layout__content').scroll(function () {
      let st = $(this).scrollTop();
      if (st < 800 && !$stBtn.hasClass('hidden')) {
        $stBtn.addClass('hidden');
      } else if (st >= 800 && $stBtn.hasClass('hidden')) {
        $stBtn.removeClass('hidden');
      }
    });
  }

  // process HTML and search filter buttons

  loadPartial();

  $('#filterButton')
    .click(() => { clickTab('#tabTopics'); scrollToTop(); return false; })
    .taphold((e) => {
      if (isMobile) $('.filter-button-tooltip')[0].MaterialTooltip.boundMouseEnterHandler(e);
      return false;
    });

  $('#favFilterButton')
    .click(() => {
      // data-fav-filter-state is reusable attr => declared explicitly, no need to (val | 0)
      let $ffBtn = $('#favFilterButton'), ffState = 1 - parseInt($ffBtn.attr('data-fav-filter-state'));
      $ffBtn.attr('data-fav-filter-state', ffState);
      $ffBtn.find('i.material-icons').html(ffState === 1 ? 'star' : 'star_border');
      $('#searchInput').trigger($.Event('keydown', { keyCode: 13 }));
      return false;
    })
    .taphold((e) => {
      if (isMobile) $('.fav-filter-button-tooltip')[0].MaterialTooltip.boundMouseEnterHandler(e);
      return false;
    });

  // process data and search

  let localforage = window.localforage;

  $.getJSON('data/abstracts.json', function (data_) { data = data_; });
  $.getJSON('data/abstracts-indexed.json', function (data_) { idx = lunr.Index.load(data_); });

  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
    name: 'NT18 OnAir'
  });

  localforage.getItem('favorites', function (err, val) {
    if (val === null)
      localforage.setItem('favorites', fav);
    else
      fav = val;
  });

  addSearchHandler();

  componentHandler.upgradeAllRegistered();

}

