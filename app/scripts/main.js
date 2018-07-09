
'use strict';


let data = null;
let idx = null;
let errorReport = null;
let fav = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
let isPhone = /Android|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
let forceReloadTap0 = -1, forceReloadTap1 = -1;

let skipA2HS = () => { $('.mdl__loader.non-standalone').transition('fade out'); };
let clickTab = (tabId) => {
  $(tabId).find('span').click();
  if (tabId === '#tabSchedule') window.swiperObj.update();
};
let scrollToTop = () => {
  $('.mdl-layout').stop().animate({ scrollTop: 0 }); // for desktop
  $('.mdl-layout__content').stop().animate({ scrollTop: 0 });
};
let validateSearchString = () => {
  return $('#searchInput').val().replace(/[^a-zA-Z0-9\-*:]+/ig, " ").trim().replace(/\s{2,}/g, ' ');
};
let doHighlight = () => {
  if ($('#searchActionMark').attr('data-highlight-state') === '1')
    $('#searchResult').mark(window.prevSearchHighlight, {
      exclude: ['h4.mdl-card__title-text', 'div.category-info *'],
      wildcards: 'enabled'
    });
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
    duration: 80,
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

  if (isMobile)
    $('head').append('<style>.mdl-button:not(.mdl-button--fab):hover{background:none!important;}</style>');

  if (isPhone) {
    let $stBtn = $('#scrollTopButton');
    $('.mdl-layout__content').scroll(function () {
      let st = $(this).scrollTop();
      if (st < 800 && !$stBtn.hasClass('hidden'))
        $stBtn.transition('fade out');
      else if (st >= 800 && $stBtn.hasClass('hidden'))
        $stBtn.transition('fade in');
    });
  }

  // process HTML and search filter buttons

  loadPartial();

  $('#filterButton')
    .click(() => { clickTab('#tabTopics'); scrollToTop(); return false; })
    .taphold((e) => {
      if (isMobile) $('.filter-button-tooltip')[0].MaterialTooltip.boundMouseEnterHandler(e);
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
    });

  $('#searchActionMark')
    .click(() => {
      let $hlBtn = $('#searchActionMark'), $searchResult = $('#searchResult');
      let hlState = 1 - parseInt($hlBtn.attr('data-highlight-state'));
      $hlBtn.attr('data-highlight-state', hlState);
      $hlBtn.find('i.material-icons').html(hlState === 1 ? 'format_color_reset' : 'border_color');
      doHighlight(); // if (hlState === 1) is included in the function
      if (hlState === 0) $searchResult.unmark();
    })
    .taphold((e) => {
      if (isMobile) $('.mark-button-tooltip')[0].MaterialTooltip.boundMouseEnterHandler(e);
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

