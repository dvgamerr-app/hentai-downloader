const xhr = require('request-ssl')
const fs = require('fs')

global._fileCookie = '.cookie'
global._fileToken = '.token'
global._appToken = fs.existsSync(global._fileToken) ? JSON.parse(fs.readFileSync(global._fileToken)) : {}
global._appCookie = fs.existsSync(global._fileCookie) ? JSON.parse(fs.readFileSync(global._fileCookie)) : []

export const getCookie = () => {
  let jar = xhr.jar()
  for (const data of global._appCookie) {
    console.log(`    - [get-cookie] ${data.referer}:${data.cookie}`)
    jar.setCookie(data.cookie, data.referer)
  }
  return jar
}
export const setCookie = (referer, headers) => {
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
    fs.writeFileSync(global._fileCookie, JSON.stringify(global._appCookie))
  }
}
