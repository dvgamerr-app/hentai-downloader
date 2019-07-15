import request from '../lib/request'

export default async (step03) => {
  if (!global._appToken.step03) return

  console.log(`[FORUMS] logout-get: ${global._appToken.step03}`)
  let html = await request('GET', global._appToken.step03)
  return /redirectwrap[\W\w]*?<h4>Thanks/ig.test(html)
}
