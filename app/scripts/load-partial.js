
'use strict';

function loadPartial() {

  $('#home-partial').load('partial/home-partial.html', () => {
    componentHandler.upgradeAllRegistered();
  });


  $('#topics').load('partial/topics-partial.html', () => {

    componentHandler.upgradeAllRegistered();

    $('#topics').find('.mdl-button__ripple-container').click(function () {

      let $target = $(this), $parent = $target.parent(), $nextAll = $target.parent().nextAll();
      let $arrow = $target.prev().children(':first');

      if (!$parent[0].hasAttribute('data-expansion')) {

        if (!$parent[0].hasAttribute('data-category')) return false;
        clickTab('#tabAbstract');
        let $searchInput = $('#searchInput');
        let searchGroup = $searchInput.val().replace(/[^a-zA-Z0-9+\-*:]+/ig, " ").split(' ');
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


  $('#schedule').load('partial/schedule-partial.html', () => {

    if (isPhone) { // init Swiper WHEN IT'S VISIBLE ($.one). https://github.com/nolimits4web/swiper/issues/2276

      $('#schedule-partial').addClass('swiper-container')
        .children().addClass('swiper-slide').css('margin-left', '0')
        .appendTo('<div class="swiper-wrapper"></div>')
        .parent().appendTo('#schedule-partial')
        .parent().append('<div class="swiper-button-prev"></div><div class="swiper-button-next"></div>');

      window.swiperObj = new Swiper('.swiper-container', {
        autoHeight: true,
        spaceBetween: 70,
        roundLengths: true,
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
      });

      $('#tabSchedule').one('click', '.mdl-layout__tab-ripple-container', () => { window.swiperObj.update(); });

    }

    componentHandler.upgradeAllRegistered();

    $('#schedule').find('.mdl-button__ripple-container').click(function () {

      let $target = $(this), $next = $target.parent().next(), $arrow = $target.prev().children(':first');
      if (!$target.hasClass('mdl-button__ripple-container')) return false;
      toggleArrowRotation($arrow);
      $next.toggleClass('hidden');

    });

  });

}
