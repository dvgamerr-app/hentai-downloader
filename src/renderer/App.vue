<template>
  <div id="app"> 
    <div class="header">
      <div class="row">
        <div class="col-xs-8">
          <div class="form-group">
            <input :readonly="state_verify" type="text" class="form-control input-sm" id="inputSuccess1" aria-describedby="helpBlock2" placeholder="https://e-hentai.org/g/1031609/631e04b5f7/" maxlength="50" @keyup.enter="onAddManga" v-model="url">
            <i class="fa fa-link fa-input-left" aria-hidden="true"></i>
            <i class="fa fa-search fa-input-right" aria-hidden="true"></i>
            <span id="helpBlock2" class="help-block" style="color: #616161;"><b>Save as directory:</b> {{directory_name}}</span>
          </div>
        </div>
        <div class="col-xs-4">
          <div class="btn-group" role="group">
            <button :disabled="state_verify" type="button" class="btn" 
              :class="!state_verify ? 'btn-success' : 'btn-default'" 
              style="padding: 5px 27px;width: 136px;" @click="onAddManga">
              <i :class="['fa', state_icon]"  aria-hidden="true"></i> {{state_name}}
            </button>
            <button :disabled="state_verify" type="button" 
              class="btn btn-default" style="padding: 5px 11px;" @click="onBrowse">
              <i class="fa fa-folder-o" aria-hidden="true"></i>
            </button>
          </div>
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
  export default {
    name: 'ghentai',
    data: () => {
      return {
        state_verify: false,
        state_icon: 'fa-download',
        state_name: 'Download',
        url: 'https://e-hentai.org/g/1031609/631e04b5f7/',
        directory_name: '%USERPROFILE%\\Downloads',
        manga: []
      }
    },

    methods: {
      urlBegin () {
        let vm = this
        let found = false
        for (var i = 0; i < vm.manga.length; i++) {
          if (vm.manga[i].url === vm.url) {
            found = true
            break
          }
        }
        if (!found) {
          vm.state_verify = true
          vm.state_icon = 'fa-circle-o-notch fa-spin fa-fw'
          vm.state_name = 'Initialize...'
          vm.URL_VERIFY(vm.url).then(manga => {
            if (manga) {
              manga.url = vm.url
              manga.status = 'WAITING'
              vm.manga.push(manga)
            }
            vm.urlDone()
          })
        }
      },
      urlDone () {
        this.state_verify = false
        this.state_icon = 'a-download'
        this.state_name = 'Download'
      },
      onAddManga (item) {
        if (/e-hentai.org\/g\/\w{1,7}\/\w{1,10}/g.test(this.url.trim())) {
          console.log('add', this.url)
          this.urlBegin()
        }
      },
      onBrowse (item) {
        let vm = this
        vm.CHANGE_DIRECTORY().then(folder => {
          if (folder) vm.directory_name = folder
        })
      }
    },
    created () {
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
    border-radius: 0px;
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
