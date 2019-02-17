const request = require('request')

const DevMode = process.env.NODE_ENV === 'development'
const endpoint = DevMode ? 'http://localhost:3000' : 'https://opensource.api-v2.touno.io/'
const token = 'JJpeNu1VAXuHk505.app-exhentai'
export default {
  DevMode,
  endpoint,
  token,
  api: (data) => {
    try {
      return request.defaults({
        method: 'POST',
        baseUrl: endpoint,
        timeout: 5000,
        json: true,
        headers: { 'X-Token': token, 'X-Access': +new Date() }
      })(data)
    } catch (ex) {
      return () => ({ })
    }
  }
}
