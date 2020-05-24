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
  const cookie = new tough.CookieJar()
  if (fs.existsSync(fileCookie)) {
    cookie.jar = tough.CookieJar.deserializeSync(JSON.parse(fs.readFileSync(fileCookie)))
  }
  return cookie
}

export const loadToken = () => {
  return fs.existsSync(fileToken) ? tough.CookieJar.deserializeSync(JSON.parse(fs.readFileSync(fileToken))) : {}
}
