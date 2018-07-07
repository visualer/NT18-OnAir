'use strict';

function addSearchHandler() {

  let $searchInput = $('#searchInput');

  $searchInput.keydown((e) => {

    if (e.keyCode !== 13) return true; // $.ui.keyCode.ENTER
    e.preventDefault();

    let $searchResult = $('#searchResult');
    let $searchActions = $('#abstract').find('.mdl-card__actions');
    let searchString = $searchInput.val().replace(/[^a-zA-Z0-9+\-*:]+/ig, " ").trim();

    let changeText = (text) => { $searchInput.parent()[0].MaterialTextfield.change(text); };


    changeText(searchString); // legitimized input
    $searchResult.html('');

    if (idx === null) {
      showMsg('Abstracts load error.', () => { location.href = errorReport; }, 'Report');
      return;
    }

    let result = [];
    try {
      result = idx.search(searchString === '' ? '*' : searchString);
    } catch (e) {
      showMsg('Unrecognized input.', () => changeText(''), 'Clear Input');
      if (!$searchActions.hasClass('hidden')) $searchActions.transition('fade out');
      return;
    }

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
    let allPagesCount = Math.ceil(result.length / 12); // maybe use bitwise operator?
    let currPageCount = 1;
    let $searchActionPrev = $('#searchActionPrev');
    let $searchActionNext = $('#searchActionNext');

    let appendResults = () => {

      $searchResult.html('');
      $searchActionPrev.attr('disabled', (currPageCount === 1) ? 'disabled' : null);
      $searchActionNext.attr('disabled', (currPageCount === allPagesCount) ? 'disabled' : null);
      $('#searchActionPageNum').html(`${currPageCount} / ${allPagesCount}`);

      result.slice((currPageCount - 1) * 12, currPageCount * 12).forEach((elem, resultIndex) => {
        $searchResult.append(generateResultTemplate(elem, resultIndex));
      });

      componentHandler.upgradeAllRegistered();

    };

    appendResults();
    $searchActionPrev.click(() => { currPageCount -= 1; appendResults(); });
    $searchActionNext.click(() => { currPageCount += 1; appendResults(); });

    componentHandler.upgradeAllRegistered();
    if ($searchActions.hasClass('hidden')) $searchActions.transition('fade in');
    $searchInput.blur();

  });
}





function generateResultTemplate(elem, resultIndex) {

  let colorSeries = ['deep-purple-300', 'deep-purple-400', 'indigo-500', 'indigo-400'];
  let colors = colorSeries.map((e) => 'mdl-color--' + e);
  let textColors = colorSeries.map((e) => 'mdl-color-text--' + e);

  let resultEntry = data[elem.ref];
  let colorIndex = resultIndex % colors.length;
  let posterNum = resultEntry.poster_num;
  let sessionIndex = ('SC'.includes(posterNum[1]) ? 2 : 4)  - parseInt(posterNum.slice(2, 5)) % 2;
  let sessionDate = ['',
    'July 17<sup>th</sup> 16:00',
    'July 18<sup>th</sup> 11:00',
    'July 19<sup>th</sup> 11:00',
    'July 19<sup>th</sup> 16:00'][sessionIndex];

  let corrIsFirst; // whether correlating author is presenting author
  let authorHTML = resultEntry.author.map((val, index) => {
    if (val === resultEntry.corr_name) {
      corrIsFirst = (index === 0);
      return `${val}*`;
    }
    else return val;
  });
  authorHTML[0] += '<sup>&ddagger;</sup>';
  authorHTML = authorHTML.join('; ');

  return $(`
          <div class="mdl-card mdl-cell mdl-shadow--2dp result-unit
                      mdl-cell--6-col-desktop mdl-cell--8-col-tablet mdl-cell--4-col-phone"
               data-article-id="${resultEntry.id}" data-result-id="${resultIndex}">
            <div class="mdl-card__title mdl-color-text--white ${colors[colorIndex]}"
                 style="min-height: 80px;">
              <h4 class="mdl-card__title-text" style="margin-top: 30px; font-size: 20px;">${resultEntry.title}</h4>
            </div>
            <div class="mdl-card__supporting-text" style="padding-top: 0; padding-bottom: 0;">
              <span class="result-content hidden">
                <h6 style="margin: 8px;">${authorHTML}</h6>
                <p style="margin-bottom: 6px;">
                  ${corrIsFirst ? '*' : ''}<sup>&ddagger;</sup>
                  Presenting${corrIsFirst ? ' and corresponding' : ''}:
                  ${resultEntry.first_email}, ${resultEntry.affl}
                </p>
                ${corrIsFirst ? '' : `<p>* Corresponding: ${resultEntry.corr_email}</p>`}
                <hr /><p style="line-height: 18px;">${resultEntry.content}</p>
              </span>
            </div>
            <div class="mdl-card__actions">
              <div class="mdl-button mdl-js-button mdl-js-ripple-effect ${textColors[colorIndex]} toggle-button">
                Toggle Details
              </div>
            </div>
            <div class="category-info">
              <p>${resultEntry.category}: ${posterNum}, ${sessionDate}</p>
            </div>
            <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon fav-button" 
                    id="favButton${resultIndex}">
              <i class="material-icons mdl-color-text--white fav-icon">
                ${fav.indexOf(resultEntry.id) > -1 ? 'star' : 'star_border'}
              </i>
            </button>
            <div class="mdl-tooltip mdl-tooltip--large mdl-tooltip--left"
                 data-mdl-for="favButton${resultIndex}" data-mdl-taphold="true">
              ${fav.indexOf(resultEntry.id) > -1 ? 'Remove from' : 'Add to'} favorites
            </div>
          </div>
        `).click((e) => {

          let $target = $(e.target.parentElement);
          let $currTarget = $(e.currentTarget);
          let currArticleId = $currTarget.attr('data-article-id');

          if ($target.hasClass('toggle-button')) {

            $currTarget.find('.result-content').toggleClass('hidden');
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
