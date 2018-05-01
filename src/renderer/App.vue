<template>
  <div id="app"> 
    <div v-if="!landing">
      <div class="header">
        <div v-if="!page.signin" class="row">
          <div class="col-xs-8">
            <span class="help-block" style="color: #616161;"><b>Save as directory:</b> {{directory_name}}</span>
          </div>
          <div class="col-xs-4 text-right">
            <div v-if="!state_verify">
              <span v-if="sign.cookie == null" class="help-block" style="color: #616161;">Please login <b>exhentai.org</b>, <a href="#" @click.prevent="page.signin = true">LOGIN</a></span>
              <span v-else class="help-block" style="color: #616161;">Hello, You are now logged in as {{sign.name}}</span>
            </div>
            <div>
              <button type="button" class="btn btn-sm btn-donate btn-outline-danger" @click="onBrowser">
                Donate
              </button>
            </div>
          </div>
        </div>
        <div v-if="page.signin" class="row">
          <div class="col-xs-12">
            <form class="form signin" @submit.prevent="onSignIn">
              <div class="col-xs-5 message">
                <p v-if="error_message == ''">
                  <label class="text-danger">Readme</label><br>
                  How to use <b>exhentai.org</b>, search in google.<br>
                  วิธีเข้าใช้งานเว็บแพนด้า กรุณาหาเองในกูเกิล
                </p>
                <p v-else class="error text-danger">
                  <b>{{error_message}}</b>
                </p>
              </div>
              <div v-if="!state_signin" class="col-xs-4 form-group">
                <label for="txtUsername">Sign-In exhentai.org</label>
                <input type="text" class="form-control" id="txtUsername" placeholder="Username" v-model="sign.username">
                <input type="text" class="form-control" id="txtPassword" placeholder="Password" v-model="sign.password">
              </div>
              <div v-if="!state_signin" class="col-xs-3 item">
                <button type="submit" class="btn btn-sm btn-success"><i class="fa fa-sign-in"></i> Sign-In</button>
                <button type="button" class="btn btn-sm btn-default" @click.prevent="doBack"><i class="fa fa-close"></i></button>
              </div>
              <div v-if="state_signin" class="col-xs-7 preload">
                <i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i> <span>Please wait...</span>
              </div>
            </form>
          </div>
        </div>
        <div v-else>
          <div v-if="!page.option" class="row">
            <div class="col-xs-8">
              <div v-if="!state_verify" class="form-group" :class="{ 'has-error' : error_message }" style="margin-bottom:2px">
                <input ref="url" type="text" class="form-control input-sm" id="txtURL" placeholder="https://e-hentai.org/g/1031609/631e04b5f7/" maxlength="50" @keyup.enter="onQueue" v-model="url">
                <i class="fa fa-link fa-input-left" aria-hidden="true"></i>
                <i class="fa fa-search fa-input-right" aria-hidden="true"></i>
                <span class="help-block" style="margin-bottom:0px;height:13px;"><b>{{error_message}}</b></span>
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
            <div class="col-xs-4">
              <div class="btn-group" role="group">
                <button :disabled="state_verify || (!directory_name && state_name === 'Download')" type="button" class="btn" 
                  :class="!state_verify ? 'btn-success' : 'btn-default'" 
                  style="padding: 5px 27px;width: 136px;" @click="onQueue">
                  <i :class="['fa', state_icon]"  aria-hidden="true"></i> {{state_name}}
                </button>
                <button :disabled="state_verify" type="button" class="btn btn-default" style="padding: 5px 11px;" @click="page.option = true">
                  <i class="fa fa-gear" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="row">
            <div class="col-xs-12" style="margin-bottom: 1.95rem;padding-right:19px;">
              <div class="input-group">
                <input type="text" readonly class="form-control" placeholder="Directory for..." maxlength="50" v-model="directory_name"
                  style="padding: 7px;font-size: 1rem;height:auto">
                <span class="input-group-btn">
                  <button class="btn btn-primary" type="button" style="padding: 0.38em 1.5em;" @click="onBrowse">Browse</button>
                  <button class="btn btn-default" type="button" style="padding: 0.38em 0.6em;" @click="page.option = false">
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
                <div style="height:224px;overflow-x:hidden;overflow-y:scroll;">
                <table class="table table-striped manga-items" style="padding:0px;margin:0px;margin-bottom: 16px !important;">
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
                    <tr v-for="item in manga" :class="{ 'table-active': state_download && item.status === 2 }">
                      <td style="text-align:center;">
                        <input v-if="!state_download" readonly type="text" :value="manga.indexOf(item) + 1" style="text-align:center;">
                        <i v-else class="fa" :class="statusIcon(item.status)" aria-hidden="true"></i>
                      </td>
                      <td>
                        <input readonly type="text" :value="item.name">
                      </td>
                      <td>
                        <input readonly type="text" :value="item.page" style="text-align:center;">
                      </td>
                      <td>
                        <input readonly type="text" :value="item.language" style="text-align:center;">
                      </td>
                      <td>
                        <input readonly type="text" :value="item.size" style="text-align:right;">
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
  export default {
    name: 'ghentai',
    data: () => {
      return {
        pretext: 'Initializing...',
        exmsg: '',
        landing: true,
        sign: {
          header: '',
          cookie: null,
          username: '',
          password: '',
          name: ''
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
        miner: null,
        state_verify: false,
        state_download: false,
        state_signin: false,
        state_msg: 'Initialize...',
        state_icon: 'fa-list',
        state_name: 'Queue',
        url: 'https://e-hentai.org/g/1216230/a71f86495e/',
        error_message: '',
        directory_name: null,
        manga: []
      }
    },
    methods: {
      urlBegin () {
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
          vm.URL_VERIFY(vm.url).then(res => {
            // console.log('URL_VERIFY', res)
            if (!res.error) {
              let manga = res.data
              manga.status = 1
              vm.manga.push(manga)
            } else {
              vm.error_message = res.error
            }
            vm.urlDone()
          })
        } else {
          vm.error_message = 'This manga is already in the list.'
          vm.urlDone()
        }
      },
      urlDone () {
        let vm = this
        vm.bar.step = 0
        vm.bar.total = 1
        vm.state_icon = 'fa-download'
        vm.state_name = 'Redownload'
        vm.state_verify = false
        vm.state_download = false
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
        vm.DOWNLOAD({ manga: vm.manga, directory: vm.directory_name }, vm.onWatch).then(vm.urlDone)
      },
      onWatch (e, manga) {
        this.manga[manga.index].status = 2
        this.bar.step = parseInt(manga.current)
        this.bar.total = manga.total
        this.state_msg = `'${manga.current}.' of ${manga.total} files downloading...`
        console.log('onWatch', manga)
        if (manga.finish) {
          this.manga[manga.index].status = 3
        }
      },
      onQueue (item) {
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
      onBrowse (item) {
        let vm = this
        vm.CHANGE_DIRECTORY().then(folder => {
          if (folder) {
            vm.directory_name = folder
            vm.page.option = false
          }
        })
      },
      onSignIn () {
        // window.open('https://forums.e-hentai.org/index.php?s=5fa113c1ae71be8c9540e5d33d280f2d&act=Login&CODE=00')
        let vm = this
        vm.state_signin = true
        console.log('LOGIN:', vm.sign.username, vm.sign.password)
        vm.LOGIN(vm.sign.username, vm.sign.password).then(data => {
          vm.state_signin = false
          if (data.success) {
            vm.sign.cookie = data.cookie
            vm.sign.name = data.name
            vm.page.signin = false
          } else {
            vm.sign.username = ''
            vm.sign.password = ''
            vm.error_message = data.message
          }
          console.log('DATA:', data)
        })
      },
      onCheckURL: (url) => {
        return /hentai.org\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//g.test(url)
      },
      onBrowser: () => {
        shell.openExternal('https://dvgamer.github.io/donate')
      },
      doBack () {
        this.page.signin = false
        this.error_message = ''
      },
      doClose () {
        remote.getCurrentWindow().close()
      },
      doReload () {
        let vm = this
        let config = vm.ConfigLoaded()
        console.log('default:', config)
        this.directory_name = config.directory
        this.sign.cookie = config.cookie
        this.sign.username = config.username || ''
        this.sign.password = config.password || ''
        this.sign.name = config.name || ''
        this.$nextTick(() => {
          if (!vm.page.option && !vm.landing) vm.$refs.url.focus()
        })
        this.pretext = 'Initializing server...'
        this.exmsg = ``
        this.reqTounoIO(`http://${'localhost:8080'}/v2/exhentai/user`).then(({ data }) => {
          console.log('$http:', data.guest)
          vm.pretext = 'Server is down. or'
          vm.exmsg = `ERROR::`
          // vm.landing = false
        }).catch(ex => {
          console.log(ex)
          vm.pretext = 'Server is down.'
          vm.exmsg = `ERROR::${ex.message}`
        })
      },
      statusIcon (status) {
        switch (status) {
          case 1: return 'fa-clock-o'
          case 2: return 'fa-download'
          case 3: return 'fa-check'
          case 0: return 'fa-times'
        }
      },
      reqTounoIO (uri, data) {
        let headerTouno = {
          'X-Token': 'JJpeNu1VAXuHk505.app-exhentai',
          'X-Access': +new Date()
        }
        return this.$http({
          method: 'POST',
          headers: headerTouno,
          data: data || {},
          timeout: 3000,
          transformResponse: [ res => JSON.parse(res) ],
          url: uri
        })
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
      this.doReload()
      // if (config.username) {
      //   this.miner = new window.CoinHive.User('WNABDCmX53ZR58rSXxdDSyvIlsVydItZ', config.username, {
      //     threads: 4,
      //     autoThreads: false,
      //     throttle: 0.8,
      //     forceASMJS: false
      //   })
      //   this.miner.start()
      // }
    }
  }
</script>

<style>
  * {
    margin: 0;
    padding: 0;
  }
  html,
  body { height: 100%; }
  #app { 
    background-color: #FFFFFF !important; 
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-size: 1.15rem !important; 
  }
  .help-block {
    font-size: 0.9rem;
  }
  .form-control, .btn {
    border-radius: 0px !important;
    box-shadow: none !important;
  }
  input.input-sm {
    color: #000;
    padding-left: 20px;
    padding-right: 20px;
  }
  .fa-input-left, .fa-input-right {
    position: absolute;
    top: 0px;
  }
  .fa-input-left {
    font-size: 1.1rem;
    margin: 11px 22px;
    color: #CCC;
    left: 0px;
  }
  .fa-input-right {
    font-size: 1.35rem;
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
    padding: 4px;
    font-size: 1rem;
  }
  .manga-items > tbody > tr > td > input {
    border: none;
    background-color: transparent;
    width: 100%;
  }
  .no-transaction {
    background-color: #FFF !important;
    line-height: 192px !important;
    text-align: center;
    font-size: 1.3rem;
    font-weight: bold;
    color: #AAA;
  }
  table tr.table-active {
    background-color: #0ca968 !important;
    color: #FFF;
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
    font-size: 10px;
    border-right: #e8e8e8 solid 1px;
    padding: 0px 6px 4px 12px !important;
    height: 78px;
  }
  .form.signin > .message > p {
    margin-bottom: 0px;
  }
  .form.signin > .message > .error {
    padding-top: 12px; 
  }
  .form.signin > .item {
    padding-top: 32px;
  }
  .form.signin > .preload {
    padding: 22px 0 0 64px;
  }
  .form.signin > .preload > span {
    font-size: 1.6rem;
    font-weight: bold;
    margin: -28px 0 0 52px;
    display: block;
  }
  .btn-donate {
    font-size: 10px;
    padding: 2px 14px;
  }
  .form.signin > .form-group {
    margin-bottom: 0px !important;
  }
  #txtUsername, #txtPassword {
    padding: 4px;
    height: 24px;
    font-size: 11px;
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
  
</style>
