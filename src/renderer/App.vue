<template>
  <div id="app"> 
    <div v-if="!landing">
      <div class="header" style="height: 85px;">
        <div v-if="!page.signin" class="row">
          <div class="col-sm-6">
            <span class="help-block pt-1 d-block"><b>Save as directory:</b> {{directory_name}}</span>
          </div>
          <div class="col-sm-6">
            <div class="text-right">
              <span v-if="!sign.name" class="help-block"><b>{{sign.name}}</b></span>
              <span v-else class="help-block" style="color: #616161;">Hello, <b>{{getHideName(sign.name)}}</b></span>
              <!-- sign.cookie == null && !state_verify -->
              <button v-tooltip.right="'Join Discord Community'" type="button" class="btn btn-sm btn-community btn-outline-info" @click="onDiscord">
                <i class="fa fa-comments-o"></i>
              </button>
              <button v-tooltip.right="'Donate to support me ❤'" type="button" class="btn btn-sm btn-donate btn-outline-danger mr-2" @click="onDonate">
                <i class="fa fa-credit-card"></i>
              </button>
              <button
                type="button"
                :disabled="state_verify || state_name == 'Loading...'"
                class="btn btn-sm btn-singin" 
                :class="state_verify || state_name == 'Loading...' ? 'btn-outline-secondary' : 'btn-outline-warning'"
                @click.prevent="page.signin = true"
              >
                Cookie
              </button>
            </div>
          </div>
        </div>
        <div v-if="page.signin" class="row">
          <div class="col-sm-12">
            <form class="form signin row" @submit.prevent="onSignIn">
              <div class="col-sm-7 message">
                <p class="mb-2">
                  วิธีเข้าใช้งานเว็บแพนด้า <a href="#" @click="onWikiExhentai"><b>exhentai.org</b></a> หลังจากนั้น กดปุ่ม <code><b>F12</b></code>
                  <br>ไปที่แท็บ <code><b>Console</b></code> แล้วพิมพ์ <code><b>copy(document.cookie)</b></code> กดปุ่ม <code><b>ENTER</b></code>
                  <br>จากนั้นให้ <code><b>ctl+v</b></code> ในช่อง cookie ด้านขวาแล้วกด <code><b>Save</b></code>
                </p>
                <span v-if="error_message != ''" class="help-block text-danger text-error">{{error_message}}</span>
              </div>
              <div v-if="!state_signin" class="col-sm-5 form-group">
                <label for="txtUsername" style="margin-bottom: 0px;">cookie:</label>
                <!-- <input type="text" class="form-control" id="txtUsername" placeholder="Username" v-model="sign.member"> -->
                <!-- <input type="text" class="form-control" id="txtPassword" placeholder="Password" v-model="sign.hash"> -->
                <input type="text" class="form-control" id="txtCookie" placeholder="document.cookie" v-model="sign.cookie">
                <button type="submit" class="btn btn-sm btn-success"><i class="fa fa-floppy-o"></i> Save</button>
                <!-- <button type="button" class="btn btn-sm btn-default" @click.prevent="doBack"><i class="fa fa-close"></i></button> -->
              </div>
              <div v-if="state_signin" class="col-sm-5 preload d-flex" style="align-items:center;justify-content:center;">
                <div>
                  <i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i> <span class="preload-text">Sign-In...</span>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div v-else>
          <div v-if="!page.option" class="row" style="margin-top:4px; margin-bottom: 6px;">
            <div class="col-sm-8">
              <div v-if="!state_verify" class="form-group" :class="{ 'has-error' : error_message }" style="margin-bottom:2px">
                <input ref="url" type="text" class="form-control input-sm input-url" id="txtURL" :placeholder="!sign.name ? 'https://e-hentai.org/g/1160960/81818b89fe/': 'https://exhentai.org/g/1169311/5b08d3935d/'" maxlength="50" @keyup.enter="onQueue" v-model="url">
                <i class="fa fa-link fa-input-left" aria-hidden="true"></i>
                <i class="fa fa-search fa-input-right" aria-hidden="true"></i>
                <span class="help-block text-danger text-error">{{error_message}}</span>
              </div>
              <div v-else style="margin-top: 4px;">
                <div class="progress" style="margin-bottom:0px;border-radius:2px;">
                  <div class="progress-bar progress-bar-info progress-bar-striped progress-bar-animated"
                  role="progressbar" :aria-valuenow="bar.total" aria-valuemin="0" :aria-valuemax="bar.total" 
                  :style="{ width: `${parseInt((bar.total < 2 && !state_download ? 1 : bar.step) * 100 / bar.total)}%` }">
                  </div>
                </div>
                <span class="help-block" v-text="state_msg"></span>
              </div>
            </div>
            <div class="col-sm-4" style="text-align:right;">
              <div class="btn-group" role="group" style="margin-bottom:2px">
                <button :disabled="state_verify || (!directory_name && state_name === 'Download')" type="button" class="btn btn-sm" 
                  :class="!state_verify ? 'btn-success' : 'btn-default'" 
                  style="width: 100px;padding:7px;" @click="onQueue">
                  <i :class="['fa', state_icon]"  aria-hidden="true"></i> {{state_name}}
                </button>
                <button v-tooltip.bottom="'Setting'" :disabled="state_verify && state_name !== 'Loading...'" type="button" class="btn btn-default" :class="[state_name === 'Loading...' ? 'text-danger' : '']" style="padding: 5px 11px;" @click.prevent="onCancel">
                  <i :class="['fa', state_name !== 'Loading...' ? 'fa-gear' : 'fa-times']" aria-hidden="true"></i>
                </button>
                <button v-tooltip.bottom="'History'" :disabled="state_verify || state_name == 'Loading...'" type="button" class="btn btn-default" :class="[state_name === 'Loading...' ? 'text-muted' : '']" style="padding: 5px 11px; margin-left: 5px;">
                  <i :class="['fa', 'fa-history']" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="row" style="margin-top:4px; margin-bottom: 6px;">
            <div class="col-sm-12">
              <div class="input-group">
                <input type="text" readonly class="form-control input-sm" placeholder="Directory for..." maxlength="50" v-model="directory_name"
                  style="padding: 7px;height:auto">
                <span class="input-group-btn">
                  <button class="btn btn-info" type="button" style="padding: 0.44em 1.5em;" @click="onBrowse">Browse</button>
                  <button class="btn btn-default" type="button" style="padding: 0.44em 0.85em" @click="page.option = false">
                    <i class="fa fa-arrow-circle-left" aria-hidden="true"></i>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <table class="table">
          <colgroup>
            <col style="width:6%;">
            <col style="width:55%;">
            <col style="width:10%;">
            <col style="width:12%;">
            <col style="width:10%;">
          </colgroup>
          <thead class="thead-dark">
            <tr>
              <th style="text-align:center;">#</th>
              <th>Name</th>
              <th style="text-align:center;">Page</th>
              <th style="text-align:center;">Language</th>
              <th style="text-align:center;">Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" style="padding: 0px !important;">
                <div style="height:210px;overflow-x:hidden;overflow-y:scroll;padding-bottom:16px;">
                <table class="table table-striped manga-items" style="padding:0px;margin:0px;margin-bottom: 0px !important;">
                  <colgroup>
                    <col style="width:6%;">
                    <col style="width:55%;">
                    <col style="width:10%;">
                    <col style="width:12%;">
                    <col style="width:10%;">
                  </colgroup>
                  <tbody>
                    <tr v-if="manga.length === 0">
                      <td colspan="5" class="no-transaction">
                        Add Quene Manga to list
                      </td>
                    </tr>
                    <tr v-for="(item, key) in manga" :key="key" :class="{ 'table-success': state_download && item.status === 2 }">
                      <td style="text-align:center;">
                        <input v-if="!state_download" readonly type="text" :value="!item.closed ? manga.indexOf(item) + 1 : 'X'" style="text-align:center;" class="input-sm">
                        <i v-else class="fa" :class="statusIcon(!item.error ? item.status : 0)" aria-hidden="true"></i>
                      </td>
                      <td>
                        <input readonly  class="input-sm" type="text" :value="item.name">
                      </td>
                      <td v-if="item.error" colspan="3">
                        <input readonly  class="input-sm input-error text-danger" type="text" :value="item.error">
                      </td>
                      <td v-if="!item.error">
                        <input readonly  class="input-sm" type="text" :value="item.page" style="text-align:center;">
                      </td>
                      <td v-if="!item.error">
                        <input readonly  class="input-sm" type="text" :value="item.language" style="text-align:center;">
                      </td>
                      <td v-if="!item.error">
                        <input readonly  class="input-sm" type="text" :value="item.size" style="text-align:right;">
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="bg-landing">
      <div class="pretext" v-text="pretext"></div>
      <div v-if="exmsg" class="premenu">
        <a class="btn btn-sm btn-outline-info" href="#" @click="doReload"><i class="fa fa-refresh"></i></a>
        <a class="btn btn-sm btn-outline-danger" href="#" @click="doClose"><i class="fa fa-close"></i></a></div>
      <div class="exmsg" v-text="exmsg"></div>
    </div>
    <div class="footer"></div>
  </div>
</template>

<script>
  const { shell, remote } = require('electron')
  const URL = require('url-parse')
  const os = require('os')
  // const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs')
  const { join } = require('path')

  const _SERVER_DONATE = 'https://touno.io/s/8jal'
  const _SERVER_COMUNITY = 'https://touno.io/s/ixj7'
  const _SERVER_WIKI = 'https://touno.io/s/dv0z'

  export default {
    name: 'ghentai',
    data: () => {
      return {
        pretext: 'Initializing...',
        exmsg: '',
        landing: true,
        sign: {
          igneous: '',
          name: null,
        },
        page: {
          signin: false,
          option: false
        },
        bar: {
          step: 0,
          total: 1
        },
        STATE: {
          FAIL: 0,
          PREPARE: 1,
          DOWNLOAD: 2,
          SUCCESS: 3
        },
        folder: {
          name: 'hentai-downloader',
          id: '_id.exh'
        },
        reset: false,
        state_verify: false,
        state_download: false,
        state_signin: false,
        state_msg: 'Initialize...',
        state_icon: 'fa-list',
        state_name: 'Queue',
        url: '', // https://e-hentai.org/g/1216230/a71f86495e/
        error_message: '',
        directory_name: null,
        manga: []
      }
    },
    methods: {
      async urlBegin () {
        let vm = this
        let found = false
        for (var i = vm.manga.length - 1; i >= 0; i--) {
          if (vm.manga[i].status !== vm.STATE.SUCCESS) {
            let url1 = new URL(vm.url)
            if (/\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(url1.pathname)[0] === vm.manga[i].ref) found = true
          } else {
            vm.manga.splice(i, 1)
          }
        }
        vm.error_message = ''
        if (!found) {
          vm.state_verify = true
          vm.state_icon = 'fa-circle-o-notch fa-spin fa-fw'
          vm.state_name = 'Initialize...'
          vm.state_msg = 'Initialize...'
          vm.INIT_MANGA(data => {
            vm.bar.step = data.page
            vm.bar.total = data.total
            vm.state_msg = `Initialize... (${data.page} / ${data.total})`
          })
          let res = await vm.URL_VERIFY(vm.url)
          if (!res.error) {
            let manga = res.data
            manga.status = 1
            if (vm.reset) vm.manga = []
            vm.manga.push(manga)
            vm.reset = false
          } else {
            let url1 = new URL(vm.url)
            vm.manga.push({
              ref: /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(url1.pathname)[0],
              name: vm.url,
              status: 0,
              error: res.error
            })
            vm.error_message = res.error
          }
          vm.urlDone()
        } else {
          vm.error_message = 'This manga is already in the list.'
          vm.urlDone()
        }
      },
      urlDone (complated) {
        let vm = this
        vm.bar.step = 0
        vm.bar.total = 1
        vm.state_icon = 'fa-download'
        if (complated) {
          vm.state_name = 'Download'
        }
        vm.state_verify = false
        vm.state_download = false
        vm.reset = complated || false
        vm.url = ''
        for (let i = 0; i < vm.manga.length; i++) {
          vm.manga[i].status = 1
        }
        vm.$nextTick(() => {
          if (!vm.landing) vm.$refs.url.focus()
        })
      },
      beginDownload () {
        let vm = this
        vm.url = ''
        vm.error_message = ''
        vm.state_verify = true
        vm.state_download = true
        vm.state_icon = 'fa-circle-o-notch fa-spin fa-fw'
        vm.state_name = 'Loading...'
        vm.DOWNLOAD({ manga: vm.manga, directory: vm.directory_name }, vm.onWatch).then(() => vm.urlDone(true))
      },
      onMouseOver () {
        // console.log('onMouseOver', key)
      },
      onMouseLeave () {
        // console.log('onMouseLeave', key)
      },
      getHideName (name) {
        if (!name) return ''
        const [ , key ] = /\w(\w*?)\w\w\w$/ig.exec(name)
        return name.replace(key, '...')
      },
      onWatch (e, manga) {
        this.manga[manga.index].status = 2
        this.bar.step = parseInt(manga.current)
        this.bar.total = manga.total
        this.state_msg = `${manga.current} of ${manga.total} files downloading...`
        // console.log('onWatch', manga)
        if (manga.finish) {
          this.manga[manga.index].status = 3
        }
      },
      onQueue () {
        if (this.url.trim() !== '' && this.onCheckURL(this.url)) {
          this.urlBegin()
        } else if (this.url.trim() !== '') {
          this.url = ''
          this.$refs.url.focus()
          this.state_verify = false
        } else if (this.manga.length > 0) {
          this.beginDownload()
        }
      },
      onBrowse () {
        let vm = this
        vm.CHANGE_DIRECTORY().then(folder => {
          if (folder) {
            vm.directory_name = folder
            vm.page.option = false
          }
        })
      },
      onRefresh: () => {
        window.history.go()
      },
      onCancel () {
        let vm = this
        if (vm.state_name !== 'Loading...') {
          vm.page.option = true
        } else {
          vm.CANCEL().then(() => {
            vm.error_message = ''
            vm.state_verify = false
            vm.state_download = false
            vm.state_icon = 'fa-download'
            vm.state_name = 'Download'
          })
        }
      },
      onSignIn () {
        let vm = this
        console.log('sign:', vm.sign)
        if (vm.sign.cookie.trim() == '') {
          this.page.signin = false
          vm.sign.name = null
          vm.sign.cookie = ''
          vm.error_message = ''
          vm.clearCookie()
          return
        }
        vm.state_signin = true
        vm.LOGIN(vm.sign.cookie.trim()).then((data) => {
          vm.error_message = ''
          vm.state_signin = false
          vm.page.signin = false
          if (data.success) {
            vm.sign.name = data.igneous
          } else {
            vm.error_message = `can't not parser cookie.`
            vm.sign.cookie = ''
          }
          vm.sign.name = data.igneous
        }).catch(ex => {
          vm.error_message = ex.message
          vm.sign.cookie = ''
          vm.state_signin = false
          vm.page.signin = false
        })
      },
      onCheckURL: (url) => {
        return /hentai.org\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//g.test(url)
      },
      onDonate: () => {
        shell.openExternal(_SERVER_DONATE)
      },
      onDiscord: () => {
        shell.openExternal(_SERVER_COMUNITY)
      },
      onWikiExhentai: () => {
        shell.openExternal(_SERVER_WIKI)
      },
      doBack () {
        this.page.signin = false
        this.error_message = ''
      },
      doClose () {
        remote.getCurrentWindow().close()
      },
      doReload () {
        const vm = this
        const config = vm.ConfigLoaded()
        console.log('ConfigLoaded::', config)
        this.directory_name = config.directory
        this.sign.cookie = config.cookie || ''
        this.sign.name = config.igneous
        this.$nextTick(() => {
          if (!vm.page.option && !vm.landing) vm.$refs.url.focus()
        })
        this.pretext = 'Initializing server...'
        this.exmsg = ``
        let appDir = join(os.tmpdir(), `../${vm.folder.name}`)

        console.log('appDir::', appDir)
        let Initialize = async () => {
          vm.CLIPBOARD(vm)
          // if (existsSync(join(appDir, vm.folder.id))) {
          //   config.guest = readFileSync(join(appDir, vm.folder.id), 'utf-8').toString()
          // }

          // let res = config.guest ? { data: { error: true } } : { data: { error: true } }
          // if (res.data.error) {
          //   let { data } = { data: {} }
          //   vm.sign.nickname = data.guest
          //   vm.ConfigSaved({
          //     user_id: data.guest,
          //     nickname: data.guest
          //   })
          //   // await vm.TounoIO('exhentai/user/register', { guest: data.guest })
          //   // await vm.TounoIO(`exhentai/user`, { g: data.guest })
          //   // write file in ./ > g_78ca1b844c
          //   let dir = join(appDir)
          //   if (!existsSync(dir)) mkdirSync(dir)
          //   writeFileSync(join(dir, vm.folder.id), data.guest, 'utf-8')
          // } else {
          //   console.log(res.data)
          //   vm.sign.nickname = res.data.nickname
          //   vm.ConfigSaved({
          //     user_id: res.data.user_id,
          //     nickname: res.data.nickname
          //   })
          // }
          return new Promise((resolve) => {
            const delay = setTimeout(() => {
              clearTimeout(delay)
              resolve()
            }, 800)
          })
        }

        Initialize().then(() => {
          vm.pretext = 'Connected.'
          vm.landing = false
        }).catch(ex => {
          vm.pretext = 'Server is down.'
          vm.exmsg = `ERROR::${ex.message}`
        })
      },
      statusIcon (status) {
        // console.log('')
        switch (status) {
          case 1: return 'fa-clock-o'
          case 2: return 'fa-download'
          case 3: return 'fa-check'
          case 0: return 'fa-times'
          default: return 'fa-times'
        }
      }
    },
    watch: {
      url (value) {
        if (value || this.manga.length === 0) {
          this.state_icon = 'fa-list'
          this.state_name = 'Queue'
        } else {
          this.state_icon = 'fa-download'
          this.state_name = 'Download'
        }
      }
    },
    created () {
      let vm = this
      vm.doReload()

      window.addEventListener('paste', async e => {
        if (!vm.state_verify && !vm.state_download && !vm.page.signin) {
          let data = e.clipboardData.getData('text').trim()
          if (/\n/ig.test(data)) {
            let row = data.split(/\n/)
            for (let i = 0; i < row.length; i++) {
              try {
                if (vm.onCheckURL(row[i].trim())) {
                  vm.url = row[i].trim()
                  await vm.urlBegin()
                }
              } catch (ex) {
                console.warn(ex)
              }
            }
            vm.$refs.url.focus()
            e.preventDefault()
          } else if (e.id !== 'txtURL') {
            vm.url = data
            vm.$refs.url.focus()
            e.preventDefault()
          }
        }
      })
    }
  }
</script>

<style>
  * {
    margin: 0;
    padding: 0;
  }
  html,
  body {
    margin: 0;
    font-family: "Segoe UI","Segoe UI Emoji","Segoe UI Symbol";
    font-size: .95rem;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    text-align: left;
    background-color: #FFF;
    height: 100%;
  }
  #app { 
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .help-block {
    font-size: 0.65rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .form-control, .btn {
    border-radius: 0px !important;
    box-shadow: none !important;
  }
  input.input-error {
    font-weight: bold;
  }
  input.input-url {
    padding: 7px;
    height: auto;
  }
  input.input-sm, input.input-sm:focus {
    color: #000;
    padding-left: 22px;
    padding-right: 20px;
    font-size: 11px;
  }
  .fa-input-left, .fa-input-right {
    position: absolute;
    top: 2px;
  }
  .fa-input-left {
    font-size: 0.8rem;
    margin: 9px 22px;
    color: #CCC;
    left: 0px;
  }
  .fa-input-right {
    font-size: 0.8rem;
    margin: 8px 23px;
    right: 0px;
  }
  .form-control:focus + .fa-input-right:before {
    color: #66afe9;
  }
  .header {
    padding: 7px 7px 0px 7px;
  }
  .bg-landing {
    height: 100vh;
    background-size: contain;
    background-image: url('assets/landing.jpg');
    font-weight: bold;
    font-size: 12px;
    color: #FFF;
  }
  .bg-landing div {
    position: absolute;
  }
  .bg-landing .pretext {
    position: absolute;
    left: 25px;
    bottom: 65px;
  }
  .bg-landing .premenu {
    position: absolute;
    right: 5px;
    top: 5px;
  }

  .bg-landing .premenu .btn {
    padding: 0px 6px 1px 6px;
  }
  .bg-landing .premenu .btn-outline-info i {
    font-size: 0.7rem;
  }
  .bg-landing .premenu .btn-outline-danger i {
    font-size: 0.8rem;
  }

  .bg-landing .exmsg {
    position: absolute;
    left: 25px;
    bottom: 45px;
    color: #a91b0c;
  }

  .footer {
    position: absolute;
    bottom: 0px;
    width: 100%;
    height: 5px;
    background-color: #324157;
    font-size: 11px;
    font-weight: bold;
    color: #585858;
  }
  .manga-items > tbody > tr > td {
    padding: 2px 4px;
  }
  .manga-items > tbody > tr > td > input {
    border: none;
    background-color: transparent;
    width: 100%;
    padding: 0px !important;
  }
  .no-transaction {
    background-color: #FFF !important;
    line-height: 192px !important;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    color: #AAA;
  }
  tr.table-success input {
    color: #FFF !important;
  }
  table tr.table-active {
    background-color: #0ca968 !important;
    color: #FFF;
  }
  .table thead.thead-dark th {
    font-size: 11px;
    padding: 0.3rem 0.75rem
  }
  .form.signin textarea {
    margin-bottom: 4px !important;
    padding: 5px !important;
    font-size: 10px;
    resize: none;
  }
  .form.signin label {
    font-size: 12px;
    font-weight: bold;
  }
  .form.signin > .message {
    font-size: .75rem;
    border-right: #e8e8e8 solid 1px;
    height: 65px;
  }
  .form.signin > .message > code {
    font-weight: bold;
  }
  .form.signin > .message > p {
    margin-bottom: 0px;
  }
  .form.signin > .message > .error {
    padding-top: 12px;
  }
  .form.signin > .item {
    padding-top: 18px;
  }
  /* .form.signin > .preload {
    padding: 22px 0 0 64px;
  } */
  .form.signin .preload-text {
    font-size: 1.3rem;
    font-weight: bold;
    color: #333;
  }
  .btn-singin {
    font-size: 10px !important;
    padding: 2px 14px;
  }
  .btn-donate {
    font-size: 10px !important;
    padding: 2px 6px;
  }
  .btn-community {
    font-size: 10px !important;
    padding: 2px 6px;
  }
  .btn-refresh {
    font-size: 10px !important;
    padding: 2px 5px;
  }
  .form.signin > .form-group {
    margin-bottom: 0px !important;
  }
  #txtCookie, #txtUsername, #txtPassword {
    padding: 4px;
    height: 20px;
    font-size: 10px;
    margin-bottom: 4px;
    border: #929292 solid 1px;
  }

  ::-webkit-scrollbar {
    width: 5px;
    height: 8px;
    background-color: #aaa;
  }
  ::-webkit-scrollbar-thumb {
      background: #000; 
  }
  .text-error {
    margin-bottom:0px;
    width: 418px;
    font-weight: bold;
    display: block;
    overflow:hidden; 
    white-space:nowrap; 
    text-overflow: ellipsis;
  }
  .v-popper--theme-tooltip .v-popper__inner {
    font-size: 0.7rem !important;
    padding: 4px 8px !important;
  }
</style>
