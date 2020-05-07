const fs = require('fs')
const tough = require('tough-cookie')
const dir = './config'

const fileCookie = `${dir}/.cookie`
const fileToken = `${dir}/.token`

if (!fs.existsSync(dir)) fs.mkdirSync(dir)

export const saveCookie = (jar) => {
  fs.writeFileSync(fileCookie, JSON.stringify(jar.serializeSync()))
}

export const loadCookie = () => {
  return fs.existsSync(fileCookie) ? tough.CookieJar.deserializeSync(JSON.parse(fs.readFileSync(fileCookie))) : null
}

export const loadToken = () => {
  return fs.existsSync(fileToken) ? tough.CookieJar.deserializeSync(JSON.parse(fs.readFileSync(fileToken))) : {}
}
