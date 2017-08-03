const state = {
  msg: {
    run: 0,
    text: ''
  },
  action: {
    search: false,
    save: false
  },
  viewer: true,
  path: null,
  dialog: false,
  loadding: false,
  source: [],
  items: []
}
// ITEMS
// = index: index,
// = saved: false,
// = verify: true,
// = prepare: false,
// = anilist: 0,
// = anime_id: null,
// = name: folder_name,
// = path: `${source}\\${folder_name}`,
// = files: []

const mutations = {
  'anime-action' (state, a) {
    state.action.search = typeof a.search === 'undefined' ? state.action.search : a.search
    state.action.save = typeof a.save === 'undefined' ? state.action.save : a.save
  },
  'anime-set_path' (state, path) {
    state.path = path
    if (path !== '' && state.source.indexOf(path) < 0) {
      state.source.push(path)
    }
  },
  'anime-add_items' (state, items) {
    state.items = items
  },
  'anime-loadding' (state) {
    state.loadding = !state.loadding
  },
  'anime-mode-view' (state, mode) {
    state.viewer = mode
  },
  'anime-new_dialog' (state, show) {
    state.dialog = show
  },
  'anime-prepare' (state, index) {
    state.items.forEach(item => { item.prepare = false })
    if (index !== undefined) {
      state.items[index].prepare = true
      state.msg.text = state.items[index].folder_name
      state.msg.run = index + 1
    }
  },
  'anime-load_list' (state, data) {
    state.items[data.index].anime = data.item
  },
  'anime-folder_name' (state, data) {
    state.items[data.index].name = data.name
  },
  'anime-set_anilist' (state, data) {
    state.items[data.index].anilist = data.id
  },
  'anime-set_verify' (state, index) {
    state.items[index].verify = !state.items[index].verify
  },
  'anime-cb' (state, cb) {
    if (typeof cb === 'function') {
      state.cb = cb
    } else {
      state.cb(cb)
    }
  },
  'anime-save' (state, data) {
    state.items[data.index].folder_name = data.name
    state.items[data.index].duplicate = data.duplicate
    state.items[data.index].saved = !data.duplicate
    state.items[data.index].id = data.id
  }
  // anime_wait (state) {
  //   state.wait = !state.wait
  // },

  // anime_cb (state, cb) {
  //   if (typeof cb === 'function') {
  //     state.cb = cb
  //   } else {
  //     state.cb(cb)
  //   }
  // },
  // anime_selected (state, data) {
  //   state.saved.items[data.index].name_search = data.name
  // },
  // anime_reset (state) {
  //   state.saved = null
  //   state.wait = false
  // }
}

export default {
  state,
  mutations
}
