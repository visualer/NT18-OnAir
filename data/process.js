let fs = require('fs');
let poster = JSON.parse(fs.readFileSync('oral.json', {encoding: 'utf8'}));

console.log(poster.length);

// fs.writeFileSync('abstracts_processed.json', JSON.stringify(poster, null, 2), { encoding: 'utf8' });