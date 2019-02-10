const xhr = require('request-ssl')
// const chalk = require('chalk')
const fs = require('fs')
const cookieFile = '.cookie'
const tokenFile = '.token'

global._appToken = fs.existsSync(tokenFile) ? JSON.parse(fs.readFileSync(tokenFile)) : {}
global._appCookie = fs.existsSync(cookieFile) ? JSON.parse(fs.readFileSync(cookieFile)) : []

const getCookie = () => {
  let jar = xhr.jar()
  for (const data of global._appCookie) {
    console.log(`    - [get-cookie] ${data.referer}:${data.cookie}`)
    jar.setCookie(data.cookie, data.referer)
  }
  return jar
}
const parseCookie = (referer, headers) => {
  if (headers['set-cookie']) {
    for (const cookie of headers['set-cookie']) {
      let [ current ] = cookie.split(';')
      let setCookie = false
      for (const data of global._appCookie) {
        if (data.cookie.split('=')[0] === current.split('=')[0] && referer === data.referer) {
          setCookie = true
          // console.log(`    - [set-cookie] ${referer}:${cookie}`)
          global._appCookie[global._appCookie.indexOf(data)].cookie = cookie
          break
        }
      }
      if (!setCookie) {
        // console.log(`    - [new-cookie] ${referer}:${cookie}`)
        global._appCookie.push({ referer: referer, cookie: cookie })
      }
    }
    fs.writeFileSync('./.cookie', JSON.stringify(global._appCookie))
  }
}

const exhentai = async (method = 'GET', uri = '', data = {}, addHeaders = {}) => {
  uri = uri.trim().replace(/&amp;/g, '&')
  let base = new URL(uri)
  let referer = `https://${base.hostname}/`
  console.log(` - [exhentai] ${method}:${uri}`)
  let httpHeaders = Object.assign({
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,ru;q=0.5,zh-TW;q=0.4,zh;q=0.3',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    ':authority': base.hostname,
    ':scheme': 'https',
    'referer': referer
  }, addHeaders)
  let request = xhr.defaults({ timeout: 5000, jar: getCookie() })

  xhr.addFingerprint('forums.e-hentai.org', 'FD:2C:52:EF:D8:67:EC:B3:E7:99:46:C6:96:68:53:6A:39:64:6B:F9')
  xhr.addFingerprint('e-hentai.org', '40:6B:8C:E8:B0:FE:F5:50:DE:94:6B:35:D3:71:A9:89:23:ED:55:25')
  xhr.addFingerprint('exhentai.org', '21:E2:AC:AA:2D:EB:32:F0:2D:39:13:8A:97:F6:78:23:D9:A5:8C:8E')
  return new Promise((resolve, reject) => {
    const callback = (error, res, body) => {
      if (error) {
        console.log(` - [exhentai] response error:`, error)
        return reject(error)
      }
      const { statusCode, headers } = res
      console.log(` - [exhentai] response code: ${statusCode} body: ${body.length} length`)
      if (([ 200, 302 ]).indexOf(statusCode) < 0) return reject(statusCode)

      parseCookie(referer, headers)
      resolve(body)
    }

    const options = {
      url: uri,
      method: method,
      header: httpHeaders,
      formData: data
    }
    request(options, callback)
  })
}

const login = async (username, password) => {
  const step00 = `https://forums.e-hentai.org/index.php?act=Login&CODE=00`
  const header01 = {
    'accept-encoding': 'gzip, deflate, br',
    'cache-control': 'max-age=0',
    'content-type': 'application/x-www-form-urlencoded'
  }

  console.log(`[FORUMS] login-form: ${step00}`)
  let html = await exhentai('GET', step00)
  let [ , step01 ] = /form action="(.*?)"/ig.exec(html) || []
  if (!step01) throw new Error(html)

  console.log(`[FORUMS] login-post: ${step01}`)
  html = await exhentai('POST', step01, {
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
  html = await exhentai('GET', step02)

  let [ , showuser, step03 ] = /userlinks[\w\W]+?href="(.+?)"[\w\W]+?href="(.+?)"/ig.exec(html) || []
  if (!step03) throw new Error(html)

  let token = {
    name: nickname,
    usr: username,
    // pwd: password,
    step00: step00,
    step01: step01,
    step02: step02,
    step03: step03,
    profile: {
      url: showuser
    }
  }
  console.log(`[FORUMS] user-token:`, token)
}

const logout = async (step03) => {
  if (!global._appToken.step03) return

  console.log(`[FORUMS] logout-get: ${global._appToken.step03}`)
  let html = await exhentai('GET', global._appToken.step03)
  return /redirectwrap[\W\w]*?<h4>Thanks/ig.test(html)
}

let username = 'dvgamer'
let password = 'dvg7po8ai'

// login(username, password)
exhentai('GET', 'https://exhentai.org/').then(html => {
  console.log(html)
})
