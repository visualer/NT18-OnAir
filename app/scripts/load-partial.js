
'use strict';

function loadPartial() {

  $('#home-partial').load('data/home-partial.html', () => {
    componentHandler.upgradeAllRegistered();
    $('#forceReloadButton').click(() => {
      let now = performance.now();
      if (now - forceReloadTap0 > 600) forceReloadTap0 = now;
      else if (now - forceReloadTap1 > 600) forceReloadTap1 = now;
      else $('head').append('<style>.mdl-button-2{position:initial;!important;}</style>');
    });
  });


  $('#topics').load('data/topics-partial.html', () => {

    componentHandler.upgradeAllRegistered();

    $('#topics').find('.mdl-button__ripple-container').click(function () {

      let $target = $(this), $parent = $target.parent(), $nextAll = $parent.nextAll();
      let $arrow = $target.prev().children(':first');

      if (!$parent[0].hasAttribute('data-expansion')) {

        if (!$parent[0].hasAttribute('data-category')) return false;
        clickTab('#tabAbstract');
        let $searchInput = $('#searchInput');
        let searchGroup = validateSearchString().split(' ');
        let categoryIndex = searchGroup.findIndex((e) => e.slice(0, 9) === 'category:');
        if (categoryIndex > -1) searchGroup.splice(categoryIndex, 1);
        $searchInput.parent()[0]
          .MaterialTextfield.change(`${searchGroup.join(' ')} category:${$parent.attr('data-category')}`);
        $searchInput.trigger($.Event('keydown', { keyCode: 13 }));  // trigger search
        scrollToTop();

        return false;
      }

      toggleArrowRotation($arrow);
      $nextAll.slice(0, parseInt($parent.attr('data-expansion'))).toggleClass('hidden');
    });

  });


  $('#schedule').load('data/schedule-partial.html', () => {

    window.swiperObj = new Swiper('.swiper-container', {
      autoHeight: true,
      spaceBetween: 70,
      roundLengths: true,
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      on: {
        update: () => {
          window.swiperInitialized = true;
          let elapsed = Math.floor((new Date() - new Date('2018/7/16 00:00:00')) / (60 * 60 * 24 * 1000));
          window.swiperObj.slideTo(elapsed > 4 || elapsed < 0 ? 0 : elapsed);
        },
        slideChange: () => {
          scrollToTop();
        }
      }
    });

    $('#tabSchedule').one('click', '.mdl-layout__tab-ripple-container', () => { window.swiperObj.update(); });


    componentHandler.upgradeAllRegistered();

    $('#schedule').find('.mdl-button__ripple-container').click(function () {
      let $target = $(this), $parent = $target.parent(), $next = $parent.next();
      let $arrow = $target.prev().children(':first');
      if ($parent[0].hasAttribute('data-poster-session-redirect')) {

        clickTab('#tabAbstract');
        let $searchInput = $('#searchInput');
        let searchGroup = validateSearchString().split(' ');
        let sessionIndex = searchGroup.findIndex((e) => e.slice(0, 8) === 'session:');
        if (sessionIndex > -1) searchGroup.splice(sessionIndex, 1);
        $searchInput.parent()[0].MaterialTextfield
          .change(`${searchGroup.join(' ')} session:${$parent.attr('data-poster-session-redirect')}`);
        $searchInput.trigger($.Event('keydown', { keyCode: 13 }));  // trigger search
        scrollToTop();

      } else {
        toggleArrowRotation($arrow);
        $next.toggleClass('hidden');
      }
      return false;
    });

  });

}
