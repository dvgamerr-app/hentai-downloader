process.env.NODE_ENV = 'production'

const { say } = require('cfonts')
const chalk = require('chalk')
const del = require('del')
const webpack = require('webpack')
const Spinnies = require('spinnies')


const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')
const webConfig = require('./webpack.web.config')

const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '
const isCI = process.env.CI || false

switch (process.env.BUILD_TARGET) {
  case 'clean': clean(); break
  case 'web': web(); break
  default: build(); break
}

function clean () {
  del.sync(['build/*', '!build/icons', '!build/icons/icon.*'])
  console.log(`\n${doneLog}\n`)
  process.exit()
}

function web () {
  del.sync(['dist/web/*', '!.gitkeep'])
  webpack(webConfig, (err, stats) => {
    if (err || stats.hasErrors()) console.log(err)

    console.log(stats.toString({
      chunks: false,
      colors: true
    }))

    process.exit()
  })
}

function greeting () {
  const cols = process.stdout.columns
  let text = ''

  if (cols > 85) text = 'lets-build'
  else if (cols > 60) text = 'lets-|build'
  else text = false

  if (text && !isCI) {
    say(text, {
      colors: ['yellow','green'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  lets-build'))
  console.log()
}


function build () {
  greeting()
  del.sync(['dist/electron/*', '!.gitkeep'])

  const spinner = { interval: 80, frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] }
  const spin = new Spinnies({ color: 'blue', succeedColor: 'green', spinner })
  spin.add('electron', { text: 'building main process' });
  spin.add('renderer', { text: 'building renderer process' });

  const pack = (config) => new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        reject(stats.toString({ chunks: false, colors: true }).split(/\r?\n/).map(line => {
          return `    ${line}`
        }).join('\n'))
      } else {
        resolve(stats.toString({ chunks: false, colors: true }))
      }
    })
  })
  let results = ''
  Promise.all([
    pack(mainConfig).then((result) => {
      results += result + '\n\n'
      spin.succeed('electron', { text: 'Success!' });
    }).catch((ex) => {
      console.error(`\n${ex}\n`)
      spin.fail('electron', { text: 'Fail :(' });
    }),
    pack(rendererConfig).then((result) => {
      results += result + '\n\n'
      spin.succeed('renderer', { text: 'Success!' });
    }).catch((ex) => {
      console.error(`\n${ex}\n`)
      spin.fail('renderer', { text: 'Fail :(' });
    })
  ]).catch(ex => {
    console.log(`\n  ${errorLog}failed to build renderer process`)
    console.error(`\n${ex}\n`)
    process.exit(1)
  }).finally(() => {
    // console.log(`\n\n${results}`)
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
    process.exit()
  })
}
