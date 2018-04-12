
function init() {

  /* Init all components and functions */

  let colorSeries = ['deep-orange-600', 'orange-700', 'orange-500', 'orange-700'];
  let colors = colorSeries.map((e) => 'mdl-color--' + e);
  let textColors = colorSeries.map((e) => 'mdl-color-text--' + e);

  let errorContainer = document.querySelector('#errorContainer');
  let showMsg = (message, actionHandler, actionText) => {
    errorContainer.MaterialSnackbar.showSnackbar({
      message: message,
      timeout: 3000,
      actionHandler: actionHandler,
      actionText: actionText
    });
  };

  let idx = null, data = null;
  let mail = null;

  $.ajaxSetup({
    error: (xhr, status, exception) => {
      mail = `mailto:accel@pku.edu.cn?subject=NT18 OnAir Bug&body=status:${status}; exception:${exception}`;
      setTimeout(() => {
        showMsg('Abstracts load error', () => {
          location.href = mail;
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


  // abstract tab processing

  $('#searchInput').keydown((e) => {

    let $searchResult = $('#searchResult');
    let $searchInput = $('#searchInput');
    let $searchActions = $('#abstract').find('.mdl-card__actions');

    if (e.keyCode !== 13) return true;
    e.preventDefault();

    if (idx === null) {
      showMsg('Abstracts load error', () => {
        location.href = mail;
      }, 'Report');
      return;
    }

    $searchResult.html('');

    let result = idx.search($searchInput.val());
    if (result.length === 0) {
      showMsg('No result', () => {
        $searchInput.val('');
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
            <section class="section--center mdl-grid mdl-shadow--2dp mdl-grid--no-spacing hidden resultUnits">
              <div class="mdl-card mdl-cell
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
                  <div class="mdl-button mdl-js-button mdl-js-ripple-effect ${textColors[colorIndex]}">
                    Toggle Content
                  </div>
                </div>
              </div>
            </section>
          `).click((e) => {
        if ($(e.target).hasClass('mdl-button__ripple-container'))
          $(e.currentTarget).find('.resultInnerContent').toggleClass('hidden');
      }));
    });

    componentHandler.upgradeAllRegistered();
    $(".resultUnits").transition({ animation: 'slide down', duration: 200, interval: 100 });
  });

  // schedule tab

  $("#schedule").load('partial/schedule.html');

  componentHandler.upgradeAllRegistered();

}


function skipA2HS() {

  $('.mdl__loader.non-standalone').transition('fade out');

}
