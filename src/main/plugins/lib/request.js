// // import { setCookie, getCookie } from './cookie'
// import axios from 'axios'
// // const xhr = require('request-ssl')

// // xhr.addFingerprint('*.e-hentai.org', 'A8:33:65:44:5E:A9:E1:83:C5:9D:26:AE:FC:B4:54:B4:24:E3:8F:3E')
// // xhr.addFingerprint('exhentai.org', '29:F4:52:CD:E5:14:EC:E7:09:84:E2:0D:3A:D3:E2:0F:4F:2C:E3:AF')

// export default async (method = 'GET', uri = '', data = {}, addHeaders = {}) => {
//   uri = uri.trim().replace(/&amp;/g, '&')
//   let base = uri instanceof URL ? uri : new URL(uri)
//   let referer = `https://${base.hostname}/`
//   let httpHeaders = Object.assign({
//     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
//     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
//     'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,ru;q=0.5,zh-TW;q=0.4,zh;q=0.3',
//     'cache-control': 'no-cache',
//     'pragma': 'no-cache',
//     ':authority': base.hostname,
//     ':scheme': 'https',
//     'referer': referer
//   }, addHeaders)
//   // let request = xhr.defaults({ timeout: 5000, jar: getCookie() })
//   return axios(Object.assign({
//     url: uri,
//     method: method || 'GET',
//     withCredentials: true,
//     timeout: 5000
//   }, options)).then((res) => {
//     return jarCookieCheck().then(() => res)
//   })
  
//   // return new Promise((resolve, reject) => {
//   //   const callback = (error, res, body) => {
//   //     if (error) {
//   //       return reject(error)
//   //     }
//   //     const { statusCode } = res
//   //     if (([ 200, 302 ]).indexOf(statusCode) < 0) return reject(statusCode)

//   //     // setCookie(referer, headers)
//   //     resolve(body)
//   //   }

//   //   const options = {
//   //     url: uri,
//   //     method: method,
//   //     header: httpHeaders,
//   //     formData: data
//   //   }
//   //   request(options, callback)
    
//   // })
// }
