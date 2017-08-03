'use strict';
const hentai = require('../e-hentai')

console.log('download link:', process.argv[2])
hentai.init(process.argv[2]).then((manga) => {

	hentai.on('event', (data) => {
		console.log(data)
	})

	return hentai.download(manga).then(() => {
		console.log('Successfully.')
	})
}).catch((ex) => {
	console.log('Fail. -->', ex)
})