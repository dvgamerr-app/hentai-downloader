'use strict'

const fs 				= require('fs')
const async 		= require('async-q')
const Q     		= require('q')
const moment 		= require('moment')
const events 		= require('events')
const xhr 			= require('request')
const request 	= require('request-promise')
const emiter 		= new events.EventEmitter()

let getImage = (res, manga, index, def) => {
	let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
	let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]

	let msg = `Downloading...  -- '${(index + 1)}.jpg' of ${manga.page} files -->`
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
	process.stdout.write(msg)

	let req = xhr({
		method: 'GET',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
			'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate',
			'Accept-Language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
			'referer':'https://e-hentai.org/'
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
  				process.stdout.cursorTo(msg.length + 1)
					process.stdout.write(` saved.`)

    			let name = manga.name.replace(/[\/\\|.:?<>"]/ig,'')
    			let dir = `./downloader/${name}/`
    			
    			if (!fs.existsSync(dir)) fs.mkdirSync(dir);
   	 			req.pipe(fs.createWriteStream(`${dir}${(index+1)}.jpg`))
					// writer.on('end', () => {
					// console.log(`     saved --> ./downloader/${index}.jpg'`)
				  def.resolve()
					// })
    			break;
    		default:
    			// console.log(index, '--> ', response.headers['content-type'])
    			def.resolve()
    			break;
    	}
    } else {
			// console.log(index, '--> ', response.statusCode, response.headers['content-type'])
  		def.resolve()
    }
  })
  req.on('error', function(err) {
		process.stdout.cursorTo(msg.length + 1)
		process.stdout.write(` ${err.message}`)
    // console.log(' not found -->', index, err.message)
    let link = manga.items[index]
    manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
  	request({ url: manga.items[index] }).then(res => { getImage(res, manga, index, def) })
  })
}


emiter.download = (manga, diectory) => {
	let all = []
	for (let i = 0; i < manga.items.length; i++) {
		// console.log('link:', manga.items[i])
		all.push(() => {
			let def = Q.defer()
			let index = i
			request(manga.items[index]).then(res => { getImage(res, manga, index, def) })
			return def.promise;
		})
	}
	return async.series(all)
}

emiter.init = link => {
	let addItem = (manga, data) => {
		let links = data.match(/gdtm".*?<a href="(.*?)">/ig)
		for (var i = 0; i < links.length; i++) {
			let link = /gdtm".*?<a href="(.*?)">/i.exec(links[i])[1]
			manga.items.push(link)
		}
	}

	return (()=> {
		let def = Q.defer()
		if (!/http.*?\/\/.*?hentai.org\/g\/\d+?\/[a-f0-9]{10}\//ig.test(link)) {
			def.reject('This link is not Hentai!!.');
		} else {
			def.resolve()
		}
		return def.promise
	})().then(() => {
		return request({
			url: link,
			header: {
				'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
				'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
				'accept-language':'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
				'cache-control':'no-cache',
				'pragma':'no-cache',
				'referer':'https://e-hentai.org/',
				'upgrade-insecure-requests':'1'
			}
		})
	}).then(res => {
		let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(res)
		let language = /Language:.*?class="gdt2">(.*?)&/ig.exec(res)
		let size = /File Size:.*?class="gdt2">(.*?)</ig.exec(res)
		let length = /Length:.*?gdt2">(.*?).page/ig.exec(res)

		let manga = { name: name[1], language: language[1], size: size[1], page: length[1], items: [] }

		if (!manga.name) throw 'manga.name is not found';
		if (!manga.language) throw 'manga.language is not found';
		if (!manga.size) throw 'manga.size is not found';
		if (!manga.page) throw 'manga.page is not found';

		console.log(manga.name)
		console.log(`${manga.language} -- ${manga.size} (${manga.page})`)

		addItem(manga, res)
		if (manga.items.length != manga.page) {
			let all = []
			for (let i = 1; i < Math.ceil(manga.page / manga.items.length); i++) {
				all.push(() => request(`${link}?p=${i}`).then((res) => addItem(manga, res)))
			}
			return async.series(all).then(()=>{
				if (manga.items.length != manga.page) throw `manga.items is '${manga.items.length}' and length is '${manga.page}'`;
				return manga;
			})
		} else {
			return manga;
		}
	})
}

module.exports = emiter