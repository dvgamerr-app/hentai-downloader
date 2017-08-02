'use strict';

const fs 				= require('fs')
const async 		= require('async-q')
const Q     		= require('q')
const request 	= require('request-promise')
const request2 	= require('request')

let getLinks = url => {
	let p = 0
	let Manga = {
		name: '',
		page: 0,
		items: []
	}
	let Images = []
	let addItem = (data) => {
		let links = data.match(/gdtm".*?<a href="(.*?)">/ig)
		for (var i = 0; i < links.length; i++) {
			let link = /gdtm".*?<a href="(.*?)">/i.exec(links[i])[1]
			Manga.items.push(link)
		}
	}

	let getImage = (res, index, def) => {
		let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
		let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]

		console.log('donwloader --> ', image)
		let req = request2({
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
				'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
				'Accept-Encoding': 'gzip, deflate',
				'Accept-Language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2'
			},
			url: image,
			timeout: 5000
		})
		req.on('response', function(response) {
	    if (response.statusCode == 200) {
	    	switch(response.headers['content-type']) {
	    		case 'image/jpg':
	    		case 'image/jpeg':
	    			// def.resolve()
	    			let dir = `./downloader/${Manga.name}/`
	    			req.pipe(fs.createWriteStream(`./downloader/${index}.jpg`))
						// writer.on('end', () => {
						console.log(`     saved --> ./downloader/${index}.jpg'`)
					  def.resolve()
						// })
	    			break;
	    		default:
	    			console.log(index, '--> ', response.headers['content-type'])
	    			def.resolve()
	    			break;
	    	}
	    } else {
  			console.log(index, '--> ', response.statusCode, response.headers['content-type'])
    		def.resolve()
	    }
	  })
	  req.on('error', function(err) {
	    console.log(' not found -->', index, err.message)
	    let link = Manga.items[index]
	    Manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
    	request({ url: Manga.items[index] }).then(res => { getImage(res, index, def) })
	  })
	}
	return request({
		url: url
	}).then(res => {
		let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(res)
		let length = /Length:.*?gdt2">(.*?).page/ig.exec(res)
		console.log(length[1], '---', name[1])
		Manga.name = name[1]
		Manga.page = length[1]
		if (!Manga.name) throw 'Manga.name is not found';
		if (!Manga.page) throw 'Manga.page is not found';
		addItem(res)
		if (Manga.items.length != Manga.page) {
			let all = []
			for (let i = 1; i < Math.ceil(Manga.page / Manga.items.length); i++) {
				console.log('page:', `${url}?p=${i}`)
				all.push(() => request({ uri: `${url}?p=${i}` }).then((res) => addItem(res)))
			}
			return async.series(all).then(()=>{
				if (Manga.items.length != Manga.page) throw `Manga.items is '${Manga.items.length}' and length is '${Manga.page}'`;
			})
		}
	}).then(() => {
		let all = []
		for (let i = 0; i < Manga.items.length; i++) {
			console.log('link:', Manga.items[i])
			all.push(() => {
				let def = Q.defer()
				let index = i
				request({ url: Manga.items[index] }).then(res => { getImage(res, index, def) })
				return def.promise;
			})
		}
		return async.series(all)
	}).then(() => {

	})
}

// https://e-hentai.org/g/1094682/dc0dc56bec/
// https://e-hentai.org/g/1065889/6f6def69bd/
getLinks('https://e-hentai.org/g/1094682/dc0dc56bec/').then(()=>{
	console.log('Successful.')
})