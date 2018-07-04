let fs = require('fs');
let poster = JSON.parse(fs.readFileSync('abstracts.json', {encoding: 'utf8'}));

for (let i = 0; i < poster.length; i++) {
    poster[i]['content'] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam mauris velit, fermentum at condimentum sit amet, mollis vel erat. Vestibulum ornare tincidunt dui, sit amet mollis nisi rhoncus sit amet. Morbi sodales, metus non dignissim condimentum, mi libero ultrices leo, ac cursus risus mauris in massa. Proin congue posuere elit et malesuada. Mauris semper id felis ut rutrum. Proin finibus venenatis magna eget condimentum. Nullam pretium felis sit amet quam laoreet, nec viverra felis congue. Integer sit amet fermentum est, ut condimentum nunc. Nunc quis metus non velit facilisis sollicitudin sed sed dui. In pellentesque, justo ut ullamcorper fringilla, magna lorem sodales sapien, nec ornare diam sem eu metus. Phasellus egestas erat at imperdiet faucibus. Maecenas placerat hendrerit tellus et rhoncus.';
}


fs.writeFileSync('abstracts_processed.json', JSON.stringify(poster, null, 2), { encoding: 'utf8' });