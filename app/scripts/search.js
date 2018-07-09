'use strict';

function addSearchHandler() {

  let $searchInput = $('#searchInput');

  $searchInput.keydown((e) => {

    if (e.keyCode !== 13) return true; // $.ui.keyCode.ENTER
    e.preventDefault();

    let $searchResult = $('#searchResult');
    let $searchActions = $('#abstract').find('.mdl-card__actions');
    let searchString = validateSearchString();
    let changeText = (text) => { $searchInput.parent()[0].MaterialTextfield.change(text); };

    changeText(searchString); // show legitimized input
    $searchResult.html('');

    if (idx === null) {
      showMsg('Abstracts load error.', () => { location.href = errorReport; }, 'Report');
      return;
    }

    let result = [];
    try {
      result = idx.search(searchString === '' ? '*' :
        searchString.split(' ').map((e) => e[0] === '-' ? e : `+${e}`).join(' ')
      );
    } catch (e) {
      showMsg('Unrecognized input.', () => changeText(''), 'Clear Input');
      if (!$searchActions.hasClass('hidden')) $searchActions.transition('fade out');
      return;
    }


    // favorite filtering
    let favFilterEnabled = $('#favFilterButton').attr('data-fav-filter-state') === "1";
    if (favFilterEnabled) result = result.filter((elem) => fav.indexOf(data[elem.ref].id) > -1);

    if (result.length === 0) {
      if (favFilterEnabled)
        showMsg('No favorites found.');
      else
        showMsg('No results found.', () => { changeText(''); }, 'Clear Input');
      if (!$searchActions.hasClass('hidden')) $searchActions.transition('fade out');
      return;
    }


    // auto paging
    let resultsPerPage = 12;
    let allPagesCount = Math.ceil(result.length / resultsPerPage); // maybe use bitwise operator?
    let currPageCount = 1;
    let $searchActionPrev = $('#searchActionPrev');
    let $searchActionNext = $('#searchActionNext');

    let appendResults = () => {

      $searchResult.html('');
      $searchActionPrev.attr('disabled', (currPageCount === 1) ? 'disabled' : null);
      $searchActionNext.attr('disabled', (currPageCount === allPagesCount) ? 'disabled' : null);
      $('#searchActionPageNum').html(`${currPageCount} / ${allPagesCount}`);

      result.slice((currPageCount - 1) * resultsPerPage, currPageCount * resultsPerPage).forEach((elem) => {
        $searchResult.append(generateResultTemplate(elem));
      });
      componentHandler.upgradeAllRegistered();
    };

    // search finalizing
    appendResults();
    $searchActionPrev.click(() => { currPageCount -= 1; appendResults(); doHighlight(); });
    $searchActionNext.click(() => { currPageCount += 1; appendResults(); doHighlight(); });
    componentHandler.upgradeAllRegistered();
    if ($searchActions.hasClass('hidden')) $searchActions.transition('fade in');
    $searchInput.blur();

    // keyword highlighting
    window.prevSearchHighlight = searchString.split(' ').map((e) => {
      if (e[0] === '-') return '';
      if (e[0] === '+') e = e.substring(1);
      if (e.substring(0, 9) === 'category:' || e.substring(0, 8) === 'session:') return '';
      // now a valid search will either be 'author:xx*', 'title:xx*', 'content:xx*', 'xx*' or 'xx'
      return e.substring(e.indexOf(':') + 1);
    });
    // as the search is valid and mark button is visible, highlight can be performed
    doHighlight();

  });
}




function generateResultTemplate(elem) {

  let colors = ['mdl-color--deep-purple-400', 'mdl-color--blue-900'];

  let resultEntry = data[elem.ref];
  let posterNum = resultEntry.poster_num;
  let colorIndex = 'SC'.includes(posterNum[1]) ? 0 : 1;
  let sessionIndex = (1 + colorIndex) * 2  - parseInt(posterNum.slice(2, 5)) % 2;
  let sessionDate = ['',
    'July 17<sup>th</sup> 16:00',
    'July 18<sup>th</sup> 11:00',
    'July 19<sup>th</sup> 11:00',
    'July 19<sup>th</sup> 16:00'][sessionIndex];


  let authorHTML = resultEntry.author
    .map((val, index) => val !== (resultEntry.corr_name || val) ?
      index !== 0 ? val : `<u>${val}</u>` :
      `${index !== 0 ? val : `<u>${val}</u>`}*`)
    .join(', ');

  return $(`
          <div class="mdl-card mdl-cell mdl-shadow--2dp result-unit
                      mdl-cell--6-col-desktop mdl-cell--8-col-tablet mdl-cell--4-col-phone"
               data-article-id="${resultEntry.id}" data-result-id="${resultEntry.id}">
            <div class="mdl-card__title mdl-color-text--white mdl-button-2 mdl-js-button
                        mdl-js-ripple-effect ${colors[colorIndex]} toggle-button"
                 style="min-height: 80px;">
              <h4 class="mdl-card__title-text" style="margin-top: 30px; font-size: 20px;">${resultEntry.title}</h4>
            </div>
            <div class="mdl-card__supporting-text hidden" style="padding-top: 0; padding-bottom: 0;">
              <h6 style="margin: 16px;">${resultEntry.authorHTML || authorHTML}</h6>
              <p>
                *Corresponding: 
                ${resultEntry.corr_email === '' ? '' : `${resultEntry.corr_email}, `}${resultEntry.affl}
              </p>
              <hr /><p style="line-height: 18px;">${resultEntry.content}</p>
            </div>
            <div class="category-info">
              <p>${resultEntry.category}: ${posterNum}, ${sessionDate}</p>
            </div>
            <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon fav-button" 
                    id="favButton${resultEntry.id}">
              <i class="material-icons mdl-color-text--white fav-icon">
                ${fav.indexOf(resultEntry.id) > -1 ? 'star' : 'star_border'}
              </i>
            </button>
            <div class="mdl-tooltip mdl-tooltip--large mdl-tooltip--left"
                 data-mdl-for="favButton${resultEntry.id}" data-mdl-taphold="true">
              ${fav.indexOf(resultEntry.id) > -1 ? 'Remove from' : 'Add to'} favorites
            </div>
          </div>
        `).click((e) => {

          let $target = $(e.target.parentElement);
          let $currTarget = $(e.currentTarget);
          let currArticleId = $currTarget.attr('data-article-id');

          if ($target.hasClass('toggle-button')) {

            $currTarget.find('.mdl-card__supporting-text').transition({ animation: 'fade', queue: false });
            return false;

          } else if ($target.hasClass('fav-button')) {

            let favIndex = fav.indexOf(currArticleId);
            let isFav = favIndex > -1;
            $currTarget.find('.fav-icon').html(`star${isFav ? '_border' : ''}`);
            if (isFav) {
              fav.splice(favIndex, 1);
            } else {
              fav.push(currArticleId);
            }
            $currTarget.find('.mdl-tooltip').html(`${isFav ? 'Add to' : 'Remove from'} favorites`);
            showMsg(`${isFav ? 'Removed from' : 'Added to'} favorites.`);
            window.localforage.setItem('favorites', fav);
            return false;
          }

        }).taphold((e) => {
          if ($(e.target.parentElement).hasClass('fav-button') && isMobile) {
            $(e.currentTarget).find('.mdl-tooltip')[0].MaterialTooltip.boundMouseEnterHandler(e);
          }
        });
}
