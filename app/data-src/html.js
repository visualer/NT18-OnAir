
let fs = require('fs');
let path = require('path');

let schedule = JSON.parse(fs.readFileSync(path.join(__dirname, 'schedule.json'), { encoding: 'utf8' }));
let content = JSON.parse(fs.readFileSync(path.join(__dirname, 'oral-pre.json'), { encoding: 'utf8' }));
let writeStream = fs.createWriteStream(path.join(__dirname, '../data/schedule-partial.html'), { encoding: 'utf8' });
let firstDate = 16; // July 16<sup>th</sup>

writeStream.write(`
<section class="mdl-grid section--center compact-list swiper-container compact-card"
        id="schedule-partial" style="align-items: start;">
<div class="swiper-wrapper">
`);

for (let i = 0; i < schedule.length; i++) {

  writeStream.write(`
  <div class="mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col-desktop
                mdl-cell--4-col-tablet mdl-cell--4-col-phone swiper-slide">
    <div class="mdl-card__title mdl-color-text--white image-card-header-poly-${i % 2 + 1}">
    <h2 class="mdl-card__title-text">July ${firstDate + i}<sup>th</sup></h2>
    </div>
    <div class="mdl-card__supporting-text">
      <ul class="mdl-list">
  `);

  let scheduleI = schedule[i];

  for (let j = 0; j < scheduleI.length; j++) {

    let scheduleIJ = scheduleI[j];

    if (scheduleIJ['event'] !== undefined) {
      writeStream.write(`
      <li class="mdl-list__item mdl-list__item--three-line">
        <span class="mdl-list__item-primary-content">
          <i class="material-icons mdl-list__item-icon">menu</i>
          <span>${scheduleIJ['event']}</span>
          <span class="mdl-list__item-text-body">${scheduleIJ['starttime']}&ndash;${scheduleIJ['endtime']}</span>
        </span>
      </li>
      `);
    } else if (scheduleIJ.order !== undefined) {

      let completeNotation = '';
      switch (scheduleIJ.order[0]) {
        case 'K':
          completeNotation = 'Keynote';
          break;
        case 'I':
          completeNotation = 'Invited';
          break;
        case 'O':
          completeNotation = 'Oral';
          break;
        case 'T':
          completeNotation = 'Tutorial';
          break;
        default:
          throw new Error(`unknown order at ${i} ${j}`);
      }
      completeNotation += ` ${scheduleIJ.order.slice(1, 3)}`;
      let index = content.findIndex((e) => e.order === scheduleIJ.order);
      if (index < 0) throw new Error(`${scheduleIJ.order} not found`);
      let cnt = content[index];

      let authorHTML = cnt.author
        .map((val, index) => val !== (cnt.corr_name || val) ?
          index !== 0 ? val : `<u>${val}</u>` :
          `${index !== 0 ? val : `<u>${val}</u>`}*`)
        .join(', ');

      writeStream.write(`
      <li class="mdl-list__item mdl-list__item--three-line mdl-button mdl-js-button mdl-js-ripple-effect">
        <span class="mdl-list__item-primary-content">
          <i class="material-icons mdl-list__item-icon">expand_less</i>
          <span>${completeNotation} by ${cnt.author[0]}</span>
          <span class="mdl-list__item-text-body">${scheduleIJ['starttime']}&ndash;${scheduleIJ['endtime']}</span>
        </span>
      </li>
      <li class="mdl-list__item hidden compact-content">
        <div class="mdl-list__item-primary-content inline-content">
          <div class="schedule-content-title">
            ${cnt['title']}
          </div>
          <h6 class="schedule-content-author">${authorHTML}</h6>
          <p>*Corresponding: ${cnt.corr_email === undefined ? '' : `${cnt.corr_email}, `}${cnt.affl}</p>
          <hr/>
          <p style="line-height: 18px;">${cnt['content'] || 'No introduction available at present.'}</p>
        </div>
      </li>
      `);

    } else if (scheduleIJ['preview'] !== undefined) {
      writeStream.write(`
      <li class="mdl-list__item mdl-list__item--three-line mdl-button mdl-js-button mdl-js-ripple-effect" 
          data-poster-session-redirect="${scheduleIJ['preview']}">
        <span class="mdl-list__item-primary-content">
          <i class="material-icons mdl-list__item-icon">more_horiz</i>
          <span>Poster Preview ${scheduleIJ['preview']} by ${scheduleIJ.by}</span>
          <span class="mdl-list__item-text-body">${scheduleIJ['starttime']}&ndash;${scheduleIJ['endtime']}</span>
        </span>
      </li>
      `);
    } else if (scheduleIJ['session'] !== undefined) {
      writeStream.write(`
      <li class="mdl-list__item mdl-list__item--three-line mdl-button mdl-js-button mdl-js-ripple-effect" 
          data-poster-session-redirect="${scheduleIJ.session}">
        <span class="mdl-list__item-primary-content">
          <i class="material-icons mdl-list__item-icon">more_horiz</i>
          <span>Poster Session ${scheduleIJ.session}, Coffee Break</span>
          <span class="mdl-list__item-text-body">${scheduleIJ['starttime']}&ndash;${scheduleIJ['endtime']}</span>
        </span>
      </li>
      `);
    } else throw new Error(`empty event at ${i} ${j}`);

  }

  writeStream.write(`
  </ul>
    </div>
  </div>
  `);

}

writeStream.write(`
</div>
  <div class="swiper-button-prev"></div>
  <div class="swiper-button-next"></div>
</section>
<section class="section--footer"></section>
`);
