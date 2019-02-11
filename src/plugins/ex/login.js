import request from '../lib/request'

const fs = require('fs')

export default async (username, password) => {
  const step00 = `https://forums.e-hentai.org/index.php?act=Login&CODE=00`
  const header01 = {
    'accept-encoding': 'gzip, deflate, br',
    'cache-control': 'max-age=0',
    'content-type': 'application/x-www-form-urlencoded'
  }

  console.log(`[FORUMS] login-form: ${step00}`)
  let html = await request('GET', step00)
  let [ , step01 ] = /form action="(.*?)"/ig.exec(html) || []
  if (!step01) throw new Error(html)

  console.log(`[FORUMS] login-post: ${step01}`)
  html = await request('POST', step01, {
    referer: `https://${new URL(step01).hostname}/`,
    b: '',
    bt: '',
    UserName: username,
    PassWord: password,
    CookieDate: 1
  }, header01)

  let [ , step02 ] = /redirectfoot.*?href="(.*?)"/ig.exec(html) || []
  let [ , nickname ] = /You.are.now.logged.in.as:(.*?)</ig.exec(html) || []
  if (!step02) throw new Error(html)

  console.log(`[FORUMS] user-view: ${step02}`)
  html = await request('GET', step02)

  let [ , showuser, step03 ] = /userlinks[\w\W]+?href="(.+?)"[\w\W]+?href="(.+?)"/ig.exec(html) || []
  if (!step03) throw new Error(html)

  html = await request('GET', showuser)
  let { groups } = /profilename[\W\w]*?font.*?>(.*?)<[\W\w]*?src='(?<img>.*?)'[\W\w]*Member Group:(?<member>.*?)<[\W\w]*?Joined:(?<join>[\W\w]*?)</ig.exec(html)
  if (!groups) throw new Error(html)

  global._appToken = {
    name: nickname,
    usr: username,
    // pwd: password,
    step00: step00,
    step01: step01,
    step02: step02,
    step03: step03,
    profile: {
      url: showuser,
      image: groups.img.trim(),
      group: groups.member.trim(),
      join: groups.join.trim()
    }
  }
  console.log(`[FORUMS] user-token:`, global._appToken)
  fs.writeFileSync(global._fileToken, JSON.stringify(global._appToken))
}
