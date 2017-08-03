<template>
  <div id="app"> 
    <div class="header">
      <div class="row">
        <div class="col-xs-9">
          <div class="form-group">
            <input type="text" class="form-control input-sm" id="inputSuccess1" aria-describedby="helpBlock2">
            <i class="fa fa-link fa-input-left" aria-hidden="true"></i>
            <i class="fa fa-search fa-input-right" aria-hidden="true"></i>
            <span id="helpBlock2" class="help-block">A block of help text that breaks onto a new line and may extend beyond one line.</span>
          </div>
        </div>
        <div class="col-xs-3">
          <button type="submit" class="btn btn-sm btn-default btn-block">
            <i class="fa fa-download" aria-hidden="true"></i> Download
          </button>
        </div>
      </div>
    </div>
    <div>
      <table class="table table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Page</th>
            <th>Size</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Name</td>
            <td>Page</td>
            <td>Size</td>
            <td>Status</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="footer"></div>
  </div>
</template>

<script>
  // v-loading.body="$store.getters.onWait"
  import store from 'renderer/vuex/store'
  export default {
    store,
    data: () => {
      return {

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

</style>
