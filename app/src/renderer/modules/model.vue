<template>
  <div>
    <transition name="dialog">
      <div v-if="show" class="modal" tabindex="-1" role="dialog" style="display: block;">
        <div class="modal-dialog" role="document" :style="{ width: width }">
          <div class="modal-content">
            <div class="modal-header">
              <slot name="header">
                <button v-if="!loading" type="button" class="close" @click.prevent="onClose" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" v-text="title"></h4>
              </slot>
            </div>
            <div class="modal-body">
              <slot name="body">
                <p v-html="message"></p>
              </slot>
            </div>
            <div ref="footer" class="modal-footer">
              <slot name="footer">
                <button ref="yes" tabindex="1" v-if="yes" :disabled="loading" type="button" class="btn" :class="yesClass" @click.prevent="onYes">
                  <i v-if="yesIcon && !loading" class="fa" :class="yesIcon" aria-hidden="true"></i>
                  <i v-if="loading" class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                  {{btnYesText}}
                </button>
                <button ref="no" tabindex="2" v-if="no" :disabled="loading" type="button" class="btn" :class="noClass" v-html="no" @click.prevent="onNo"></button>
                <button ref="cancel" tabindex="3" v-if="cancel" :disabled="loading"  type="button" class="btn" :class="cancelClass" v-html="cancel" @click.prevent="onCancel" data-dismiss="modal"></button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="dialog">
      <div v-if="show" class="modal-backdrop in"></div>
    </transition>
  </div>
</template>
<script>
  // import { shell } from 'electron'
  // import localforage from 'localforage'

  // import store from 'renderer/vuex/store'
  // import axios from '../../lib/axios'
  export default {
    name: 'v-model',
    props: {
      show: {
        type: Boolean,
        default: false
      },
      loading: {
        type: Boolean,
        default: false
      },
      width: {
        type: String,
        default: null
      },
      title: {
        type: String,
        default: window.document.title
      },
      yesClass: {
        type: String,
        default: 'btn-primary'
      },
      yesIcon: {
        type: String,
        default: null
      },
      noClass: {
        type: String,
        default: 'btn-default'
      },
      cancelClass: {
        type: String,
        default: 'btn-default'
      },
      message: {
        type: String,
        default: 'message'
      },
      yes: {
        type: String,
        default: null
      },
      no: {
        type: String,
        default: null
      },
      cancel: {
        type: String,
        default: null
      },
      onYes: {
        type: Function,
        default () {}
      },
      onNo: {
        type: Function,
        default () {}
      },
      onCancel: {
        type: Function,
        default () {}
      }
    },
    computed: {
      btnYesText () {
        return !this.loading ? this.yes : (this.loadingText ? this.loadingText : 'PLEASE WAIT...')
      }
    },
    methods: {
      onClose () { return this.cancel ? this.onCancel() : this.onNo() }
    },
    watch: {
      show: onshow => {
        // if (onshow) {
        //   this.$nextTick(() => {
        //     if (this.cancel) {
        //       this.$refs.cancel.focus()
        //     } else if (this.no) {
        //       this.$refs.no.focus()
        //     } else if (this.yes) {
        //       this.$refs.yes.focus()
        //     }
        //   })
        // }
      }
    }
  }
</script>

<style>
.modal, .modal-backdrop {
  transition: opacity .3s ease;
}
.modal-dialog {
  transition: all .3s ease;
}
.dialog-enter {
  opacity: 0 !important;
}
.dialog-leave-active {
  opacity: 0 !important;
}
.dialog-enter .modal-dialog,
.dialog-leave-active .modal-dialog {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
