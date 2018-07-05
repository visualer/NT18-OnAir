
'use strict';


let data = null;
let idx = null;
let errorReport = null;
let fav = [];
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
let isPhone = /Android|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
let swiperObj = null;
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

    if (isPhone) {
      // init swiper
      $('#schedule-partial').addClass('swiper-container')
        .children().addClass('swiper-slide').css('margin-left', '0')
        .appendTo('<div class="swiper-wrapper"></div>')
        .parent().appendTo('#schedule-partial')
        .parent().append('<div class="swiper-button-prev"></div><div class="swiper-button-next"></div>');

      swiperObj = new Swiper('.swiper-container', {
        spaceBetween: 70,
        roundLengths: true,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
      });
      $('#tabSchedule').one('click', '.mdl-layout__tab-ripple-container', () => {
        // swiper should be initialized when it's visible. https://github.com/nolimits4web/swiper/issues/2276
        swiperObj.update();
      })
    }

    componentHandler.upgradeAllRegistered();
    $('#schedule').find('.mdl-button__ripple-container').click(function () {
      let $target = $(this), $arrow = $target.prev().children(':first'), $next = $target.parent().next();
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
    });

  });

  let localforage = window.localforage;

  $.getJSON('data/abstracts.json', function (data_) { data = data_; });
  $.getJSON('data/abstracts-indexed.json', function (data_) { idx = lunr.Index.load(data_); });

  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
    name: 'NT18 OnAir'
  });

  localforage.getItem('favorites', function (err, val) {
    if (val === null) {
      localforage.setItem('favorites', fav);
    } else {
      fav = val;
    }
  });

  addSearchHandler();

  componentHandler.upgradeAllRegistered();

}

