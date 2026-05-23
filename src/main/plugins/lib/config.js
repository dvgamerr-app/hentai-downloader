import fs from 'fs'

const dir = './config'
if (!fs.existsSync(dir)) fs.mkdirSync(dir)
