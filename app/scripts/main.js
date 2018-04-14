
'use strict';


let data = null;
let idx = null;
let errorReport = null;
let LocalForage = window.localforage;
let fav = [];
let isPC = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

function showMsg(message, actionHandler = () => {}, actionText = 'OK') {
  let sb = document.querySelector('#msgContainer').MaterialSnackbar;
  sb.showSnackbar({
    message: message,
    timeout: 3000,
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
        showMsg('Load error', () => {
          location.href = errorReport;
        }, 'Report');
      }, 3000);
    }
  });

  $.getJSON('data/abstracts.json', function (data_) {
    data = data_;
    idx = lunr(function () {
      this.ref('id');
      this.field('title');
      this.field('lab');
      this.field('content');
      this.field('author');
      data.forEach(function (doc) {
        this.add({
          id: doc.id,
          title: doc.title,
          author: doc.author.join(' '),
          lab: doc.lab.join(' '),
          content: doc.content,
          mapping: doc.mapping
        });
      }, this);
    });
  });

  LocalForage.config({
    driver: LocalForage.INDEXEDDB,
    name: 'NT18 OnAir'
  });

  LocalForage.getItem('favorites', function (err, val) {
    if (val === null) {
      LocalForage.setItem('favorites', fav);
    } else {
      fav = val;
    }
  });

  // abstract tab

  addSearchHandler();

  // schedule tab

  $('#schedule').load('partial/schedule.html');

  componentHandler.upgradeAllRegistered();

}


function addSearchHandler() {

  let colorSeries = ['deep-purple-300', 'deep-purple-400', 'indigo-500', 'indigo-400'];
  let colors = colorSeries.map((e) => 'mdl-color--' + e);
  let textColors = colorSeries.map((e) => 'mdl-color-text--' + e);

  let $searchInput = $('#searchInput');
  let $searchInputLabel = $searchInput.parent().children('label');
  $searchInput.focus(() => {
    $searchInputLabel.html('Search...');
  });
  $searchInput.blur(() => {
    if ($searchInput.val() === '')
      $searchInputLabel.html('Search... or enter ":all" ":fav"');
  });

  $searchInput.keydown((e) => {

    let $searchResult = $('#searchResult');
    let $searchInput = $('#searchInput');
    let $searchActions = $('#abstract').find('.mdl-card__actions');

    if (e.keyCode !== 13) return true;
    e.preventDefault();

    if (idx === null) {
      showMsg('Abstracts load error', () => {
        location.href = errorReport;
      }, 'Report');
      return;
    }

    $searchResult.html('');

    let searchString = $searchInput.val();
    let result = idx.search((searchString === ':all' || searchString === ':fav') ? '*' : searchString);
    if (searchString === ':fav') {
      result = result.filter((elem) => fav.indexOf(elem.ref) > -1);
    }


    if (result.length === 0) {
      showMsg('No ' + (searchString === ':fav' ? 'favorites' : 'result'), () => {
        $searchInput.parent()[0].MaterialTextfield.change('');
      }, 'Clear Input');
      if (!$searchActions.hasClass('hidden')) $searchActions.transition('fade out');
      return;
    }
    if ($searchActions.hasClass('hidden')) $searchActions.transition('fade in');

    result.forEach(function (elem, resultIndex) {

      let resultJson = data[elem.ref];
      let authors = resultJson.author
        .map((authorName, index) => `${authorName}<sup>${resultJson.mapping[index]}</sup>`).join(', ');
      let labs = resultJson.lab
        .map((labName, index) => `(${index + 1}) ${labName}`).join(', ');
      let colorIndex = resultIndex % colors.length;

      $searchResult.append($(`
          <div class="mdl-card mdl-cell mdl-shadow--2dp result-unit hidden
                      mdl-cell--12-col-desktop mdl-cell--8-col-tablet mdl-cell--4-col-phone">
            <div class="mdl-card__title mdl-color-text--white ${colors[colorIndex]}"
                 style="min-height: 80px;">
              <h4 class="mdl-card__title-text" style="margin-top: 30px;">${resultJson.title}</h4>
            </div>
            <div class="mdl-card__supporting-text">
              <h6 style="margin: 12px;">${authors}</h6><br /><p>${labs}</p>
              <span class="resultInnerContent hidden"><hr />${resultJson.content}</span>
            </div>
            <div class="mdl-card__actions">
              <div class="mdl-button mdl-js-button mdl-js-ripple-effect ${textColors[colorIndex]} toggle-button"
                   id="toggleButton${resultIndex}">
                Toggle Content
              </div>
            </div>
            <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon fav-button" 
                    id="favButton${resultIndex}">
              <i class="material-icons mdl-color-text--white">
                ${fav.indexOf(resultJson.id) > -1 ? 'star' : 'star_border'}
              </i>
            </button>
            <div class="mdl-tooltip mdl-tooltip--large mdl-tooltip--left" id="tooltip${resultIndex}"
                 data-mdl-for="favButton${resultIndex}" data-mdl-taphold="true">
              ${fav.indexOf(resultJson.id) > -1 ? 'Remove from' : 'Add to'} favorites
            </div>
          </div>
        `).click((e) => {
          if ($(e.target.parentElement).hasClass('toggle-button'))
            $(e.currentTarget).find('.resultInnerContent').toggleClass('hidden');
        })
      );

      $(`#favButton${resultIndex}`)
        .on('click', function () {
          let favIndex = fav.indexOf(resultJson.id);
          let isFav = favIndex > -1;
          $(this).find('i').html('star' + (isFav ? '_border' : ''));
          if (isFav)
            fav.splice(favIndex, 1);
          else
            fav.push(resultJson.id);
          $(`#tooltip${resultIndex}`).html(`${isFav ? 'Add to' : 'Remove from'} favorites`);
          showMsg((isFav ? 'Removed from' : 'Added to') + ' favorites');
          LocalForage.setItem('favorites', fav);
        })
        .on('taphold', (ev) => {
          if (isPC)
            $(`#tooltip${resultIndex}`)[0].MaterialTooltip.boundMouseEnterHandler(ev);
        });

    });

    componentHandler.upgradeAllRegistered();

    $('.result-unit').transition({ animation: 'slide down', duration: 200, interval: 100 });

  });

}

function skipA2HS() {
  $('.mdl__loader.non-standalone').transition('fade out');
}

function clickTab(tabId) {
  $(tabId).find('span').click();
  scrollTo(0, 0);
}
