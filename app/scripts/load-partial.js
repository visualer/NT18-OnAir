
'use strict';

function loadPartial() {

  $('#home-partial').load('data/home-partial.html', () => {
    componentHandler.upgradeAllRegistered();
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


  $('#schedule').load('data/schedule-partial.html', () => {

    window.swiperObj = new Swiper('.swiper-container', {
      autoHeight: true,
      spaceBetween: 70,
      roundLengths: true,
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
    });

    $('#tabSchedule').one('click', '.mdl-layout__tab-ripple-container', () => { window.swiperObj.update(); });


    componentHandler.upgradeAllRegistered();

    $('#schedule').find('.mdl-button__ripple-container').click(function () {
      let $target = $(this), $parent = $target.parent(), $next = $parent.next();
      let $arrow = $target.prev().children(':first');
      if ($parent[0].hasAttribute('data-poster-session-redirect')) {

        clickTab('#tabAbstract');
        let $searchInput = $('#searchInput');
        let searchGroup = $searchInput.val().replace(/[^a-zA-Z0-9+\-*:]+/ig, " ").split(' ');
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
