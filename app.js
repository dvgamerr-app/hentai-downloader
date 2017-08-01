const request = require('request-promise')

let Manga = {
	name: '',
	page: 0,
	items: []
}
let addItem = (data) => {
	data.match(/gdtm".*?<a href="(.*?)">/ig).forEach(line => {
		let link = /gdtm".*?<a href="(.*?)">/i.exec(line)[1]
		console.log(link)
		Manga.items.push(link)
	})
}
let p = 0
let getLinks = url => {
	return request({
		url: url
	}).then(res => {
		let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(res)
		let length = /Length:.*?gdt2">(.*?).page/ig.exec(res)
		console.log(length[1], '---', name[1])
		Manga.name = name[1]
		Manga.page = length[1]
		addItem(res)
		if (Manga.items.length != Manga.page) {
			console.log('page loop 1 to', Math.ceil(Manga.page / Manga.items.length) - 1)
		}
	})
}

getLinks('https://e-hentai.org/g/1094682/dc0dc56bec/').then(()=>{
	console.log('success.')
})