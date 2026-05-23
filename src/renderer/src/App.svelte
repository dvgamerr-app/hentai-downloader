<script>
  import { onMount, tick } from 'svelte'
  import landingJpg from './assets/landing.jpg'

  const _SERVER_DONATE    = 'https://touno.io/s/8jal'
  const _SERVER_COMMUNITY = 'https://touno.io/s/ixj7'
  const _SERVER_WIKI      = 'https://touno.io/s/dv0z'
  const STATE = { FAIL: 0, PREPARE: 1, DOWNLOAD: 2, SUCCESS: 3 }

  let landing       = $state(true)
  let pretext       = $state('Initializing...')
  let exmsg         = $state('')

  let sign          = $state({ name: null, cookie: '' })
  let page          = $state({ signin: false, option: false })

  let bar           = $state({ step: 0, total: 1 })
  let state_verify  = $state(false)
  let state_download= $state(false)
  let state_signin  = $state(false)
  let state_msg     = $state('Initialize...')
  let state_icon    = $state('fa-list')
  let state_name    = $state('Queue')

  let url           = $state('')
  let error_message = $state('')
  let directory_name= $state('')
  let manga         = $state([])
  let urlRef        = $state(null)

  let barPct = $derived(
    Math.round((bar.total < 2 && !state_download ? 1 : bar.step) * 100 / bar.total)
  )

  $effect(() => {
    if (url || manga.length === 0) { state_icon = 'fa-list';     state_name = 'Queue'    }
    else                           { state_icon = 'fa-download'; state_name = 'Download' }
  })

  const getHideName = (name) => {
    if (!name) return ''
    const m = /\w(\w*?)\w\w\w$/i.exec(name)
    return m ? name.replace(m[1], '...') : name
  }

  const statusIcon = (s) => ({ 1:'fa-clock-o', 2:'fa-download', 3:'fa-check' }[s] ?? 'fa-times')
  const checkURL   = (u) => /hentai\.org\/\w\/\d{1,8}\/[0-9a-f]+?\//i.test(u)

  async function urlBegin() {
    const [ref] = /\/\w\/\d{1,8}\/[0-9a-f]+?\//i.exec(new URL(url).pathname) ?? []
    const found  = manga.some(m => m.status !== STATE.SUCCESS && m.ref === ref)
    manga        = manga.filter(m => m.status !== STATE.SUCCESS)
    error_message = ''

    if (!found) {
      state_verify = true
      state_icon = 'fa-circle-o-notch fa-spin fa-fw'
      state_name = 'Initialize...'
      state_msg  = 'Initialize...'

      window.api.initManga(data => {
        bar.step  = data.page
        bar.total = data.total
        state_msg = `Initialize... (${data.page} / ${data.total})`
      })

      const res = await window.api.urlVerify(url)
      if (!res.error) {
        manga = [...manga, { ...res.data, status: STATE.PREPARE }]
      } else {
        manga = [...manga, { ref, name: url, status: STATE.FAIL, error: res.error }]
        error_message = res.error
      }
      urlDone()
    } else {
      error_message = 'This manga is already in the list.'
      urlDone()
    }
  }

  async function urlDone(completed = false) {
    bar = { step: 0, total: 1 }
    state_icon    = 'fa-download'
    if (completed) state_name = 'Download'
    state_verify  = false
    state_download= false
    url           = ''
    manga         = manga.map(m => ({ ...m, status: STATE.PREPARE }))
    await tick()
    urlRef?.focus()
  }

  function beginDownload() {
    url = ''; error_message = ''
    state_verify = true; state_download = true
    state_icon = 'fa-circle-o-notch fa-spin fa-fw'; state_name = 'Loading...'
    window.api.download({ manga: $state.snapshot(manga), directory: directory_name }, onWatch)
      .then(() => urlDone(true))
  }

  function onWatch(data) {
    manga = manga.map((m, i) => i === data.index
      ? { ...m, status: data.finish ? STATE.SUCCESS : STATE.DOWNLOAD }
      : m
    )
    bar.step  = parseInt(data.current)
    bar.total = data.total
    state_msg = `${data.current} of ${data.total} files downloading...`
  }

  async function onQueue() {
    if (url.trim() && checkURL(url))        await urlBegin()
    else if (url.trim())                    { url = ''; urlRef?.focus(); state_verify = false }
    else if (manga.length > 0)              beginDownload()
  }

  async function onBrowse() {
    const folder = await window.api.changeDirectory()
    if (folder) { directory_name = folder; page.option = false }
  }

  function onCancel() {
    if (state_name !== 'Loading...') {
      page.option = true
    } else {
      window.api.cancel()
      error_message = ''; state_verify = false; state_download = false
      state_icon = 'fa-download'; state_name = 'Download'
    }
  }

  async function onSignIn(e) {
    e.preventDefault()
    if (!sign.cookie.trim()) {
      page.signin = false; sign.name = null; sign.cookie = ''; error_message = ''
      await window.api.clearCookie(); return
    }
    state_signin = true
    try {
      const data = await window.api.login(sign.cookie.trim())
      state_signin = false; page.signin = false; error_message = ''
      sign.name = data.success ? data.igneous : null
      if (!data.success) { error_message = "can't parse cookie."; sign.cookie = '' }
    } catch (ex) {
      error_message = ex.message; sign.cookie = ''; state_signin = false; page.signin = false
    }
  }

  async function onPasteClipboard(data) {
    if (state_verify || state_download || page.signin) return
    for (const row of data.split(/\n/)) {
      try { if (checkURL(row.trim())) { url = row.trim(); await urlBegin() } }
      catch (ex) { console.warn(ex) }
    }
  }

  function handlePaste(e) {
    const data = e.clipboardData.getData('text').trim()
    if (e.target?.id !== 'txtURL' && !/\n/i.test(data)) {
      url = data
      if (checkURL(data)) urlBegin()
      tick().then(() => urlRef?.focus())
      e.preventDefault(); return
    }
    onPasteClipboard(data); e.preventDefault()
  }

  async function doReload() {
    try {
      const config = await window.api.configLoaded()
      directory_name = config.directory || ''
      sign.cookie    = config.cookie    || ''
      sign.name      = config.igneous   || null
      pretext = 'Initializing server...'; exmsg = ''
      window.api.clipboard(onPasteClipboard)
      await new Promise(r => setTimeout(r, 800))
      pretext = 'Connected.'; landing = false
      await tick(); urlRef?.focus()
    } catch (ex) {
      pretext = 'Server is down.'; exmsg = `ERROR::${ex.message}`
    }
  }

  onMount(() => {
    doReload()
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  })
</script>

<!-- ─── Root ─────────────────────────────────────────────────────────────── -->
<div class="relative flex flex-col w-full h-screen overflow-hidden font-sans text-xs text-gray-800 bg-white select-none">

  {#if !landing}

    <!-- ─── Header 85px ─────────────────────────────────────────────────── -->
    <div class="shrink-0 h-[85px] px-2 pt-1.5 overflow-hidden">

      {#if page.signin}
        <!-- Cookie sign-in form -->
        <form class="flex gap-2 h-full" onsubmit={onSignIn}>
          <div class="flex-1 text-[11px] leading-4 border-r border-gray-200 pr-2 overflow-hidden">
            <p>
              เข้าใช้งาน <a href="#" class="text-[#18BC9C] font-bold underline"
                onclick={(e) => { e.preventDefault(); window.electron.shell.openExternal(_SERVER_WIKI) }}>exhentai.org</a>
              กด <code class="bg-gray-100 px-1 font-bold">F12</code>
              → <code class="bg-gray-100 px-1 font-bold">Console</code>
              → พิมพ์ <code class="bg-gray-100 px-1 font-bold">copy(document.cookie)</code>
              → <code class="bg-gray-100 px-1 font-bold">ENTER</code>
              แล้ว <code class="bg-gray-100 px-1 font-bold">Ctrl+V</code> ด้านขวา
            </p>
            {#if error_message}
              <span class="text-red-500 font-bold truncate block mt-0.5">{error_message}</span>
            {/if}
          </div>

          {#if !state_signin}
            <div class="w-44 flex flex-col justify-center gap-1">
              <label class="font-bold text-[11px]">cookie:</label>
              <input
                id="txtCookie" type="text" placeholder="document.cookie"
                bind:value={sign.cookie}
                class="border border-gray-400 px-1 py-0.5 text-[11px] outline-none w-full"
              />
              <button type="submit"
                class="bg-[#18BC9C] text-white px-2 py-0.5 text-[11px] hover:bg-[#16a085] transition-colors self-start">
                <i class="fa fa-floppy-o mr-1"></i>Save
              </button>
            </div>
          {:else}
            <div class="w-44 flex items-center justify-center gap-2">
              <i class="fa fa-circle-o-notch fa-spin fa-2x text-gray-400"></i>
              <span class="text-sm font-bold text-gray-500">Sign-In...</span>
            </div>
          {/if}
        </form>

      {:else}
        <!-- Top row: directory + auth buttons -->
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-gray-500 truncate flex-1 mr-2">
            <b class="text-gray-700">Save:</b> {directory_name}
          </span>
          <div class="flex items-center gap-1 shrink-0">
            {#if sign.name}
              <span class="text-gray-400 mr-1">Hello, <b>{getHideName(sign.name)}</b></span>
            {/if}
            <button title="Join Discord Community"
              onclick={() => window.electron.shell.openExternal(_SERVER_COMMUNITY)}
              class="border border-sky-500 text-sky-500 px-1.5 py-0.5 hover:bg-sky-500 hover:text-white transition-colors">
              <i class="fa fa-comments-o"></i>
            </button>
            <button title="Donate ❤"
              onclick={() => window.electron.shell.openExternal(_SERVER_DONATE)}
              class="border border-red-400 text-red-400 px-1.5 py-0.5 hover:bg-red-400 hover:text-white transition-colors mr-1">
              <i class="fa fa-credit-card"></i>
            </button>
            <button
              disabled={state_verify || state_name === 'Loading...'}
              onclick={() => { page.signin = true }}
              class="border px-2 py-0.5 text-[11px] transition-colors
                {state_verify || state_name === 'Loading...'
                  ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                  : 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'}">
              Cookie
            </button>
          </div>
        </div>

        <!-- Bottom row: URL/progress + action buttons -->
        {#if !page.option}
          <div class="flex items-start gap-1">
            <div class="flex-1 relative">
              {#if !state_verify}
                <i class="fa fa-link absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"></i>
                <input
                  bind:this={urlRef}
                  id="txtURL" type="text" bind:value={url}
                  placeholder={!sign.name
                    ? 'https://e-hentai.org/g/1160960/81818b89fe/'
                    : 'https://exhentai.org/g/1169311/5b08d3935d/'}
                  maxlength="80"
                  onkeyup={(e) => e.key === 'Enter' && onQueue()}
                  class="w-full border {error_message ? 'border-red-400' : 'border-gray-300'}
                    pl-5 pr-5 py-1 text-xs outline-none focus:border-blue-400"
                />
                <i class="fa fa-search absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"></i>
                {#if error_message}
                  <p class="text-red-500 font-bold truncate text-[11px] mt-0.5 leading-none">{error_message}</p>
                {/if}
              {:else}
                <div class="w-full bg-gray-200 h-2 mt-1">
                  <div class="bg-blue-400 h-full transition-all duration-300" style="width:{barPct}%"></div>
                </div>
                <p class="text-gray-500 text-[11px] mt-0.5 leading-none">{state_msg}</p>
              {/if}
            </div>

            <div class="flex gap-0.5 shrink-0">
              <button
                disabled={state_verify || (!directory_name && state_name === 'Download')}
                onclick={onQueue}
                class="w-24 py-1 text-xs transition-colors
                  {!state_verify
                    ? 'bg-[#18BC9C] text-white hover:bg-[#16a085]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                  disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fa {state_icon} mr-1"></i>{state_name}
              </button>
              <button
                title={state_name !== 'Loading...' ? 'Setting' : 'Cancel'}
                disabled={state_verify && state_name !== 'Loading...'}
                onclick={onCancel}
                class="px-2 py-1 border border-gray-300 text-gray-500 hover:border-gray-500 transition-colors
                  {state_name === 'Loading...' ? 'text-red-500 border-red-300 hover:border-red-500' : ''}
                  disabled:opacity-40 disabled:cursor-not-allowed">
                <i class="fa {state_name !== 'Loading...' ? 'fa-gear' : 'fa-times'}"></i>
              </button>
              <button
                title="History"
                disabled={state_verify || state_name === 'Loading...'}
                class="px-2 py-1 border border-gray-300 text-gray-400 hover:border-gray-500 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed">
                <i class="fa fa-history"></i>
              </button>
            </div>
          </div>

        {:else}
          <!-- Directory picker -->
          <div class="flex gap-1">
            <input
              type="text" readonly bind:value={directory_name}
              placeholder="Directory for..."
              class="flex-1 border border-gray-300 px-2 py-1 text-xs outline-none bg-gray-50"
            />
            <button onclick={onBrowse}
              class="bg-sky-500 text-white px-3 py-1 text-xs hover:bg-sky-600 transition-colors">
              Browse
            </button>
            <button onclick={() => { page.option = false }}
              class="border border-gray-300 text-gray-500 px-2 py-1 text-xs hover:border-gray-500 transition-colors">
              <i class="fa fa-arrow-circle-left"></i>
            </button>
          </div>
        {/if}
      {/if}
    </div>

    <!-- ─── Manga table ──────────────────────────────────────────────────── -->
    <div class="flex-1 overflow-hidden">
      <table class="w-full border-collapse table-fixed">
        <colgroup>
          <col class="w-[6%]">
          <col class="w-[55%]">
          <col class="w-[10%]">
          <col class="w-[12%]">
          <col class="w-[10%]">
        </colgroup>
        <thead class="bg-[#2C3E50] text-white">
          <tr>
            <th class="py-1 px-2 text-center font-normal">#</th>
            <th class="py-1 px-2 font-normal text-left">Name</th>
            <th class="py-1 px-2 text-center font-normal">Page</th>
            <th class="py-1 px-2 text-center font-normal">Language</th>
            <th class="py-1 px-2 text-center font-normal">Size</th>
          </tr>
        </thead>
      </table>
      <div class="h-[210px] overflow-y-auto overflow-x-hidden">
        <table class="w-full border-collapse table-fixed">
          <colgroup>
            <col class="w-[6%]">
            <col class="w-[55%]">
            <col class="w-[10%]">
            <col class="w-[12%]">
            <col class="w-[10%]">
          </colgroup>
          <tbody>
            {#if manga.length === 0}
              <tr>
                <td colspan="5" class="text-center text-gray-300 font-bold py-20 text-sm">
                  Add Queue Manga to list
                </td>
              </tr>
            {:else}
              {#each manga as item, i}
                <tr class="border-b border-gray-100 transition-colors
                  {i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                  {state_download && item.status === STATE.DOWNLOAD ? '!bg-[#18BC9C] text-white' : ''}
                  {state_download && item.status === STATE.SUCCESS  ? '!bg-[#18BC9C]/30' : ''}">
                  <td class="py-0.5 px-1 text-center">
                    {#if !state_download}
                      <input readonly value={i + 1}
                        class="w-full bg-transparent border-none outline-none text-center text-[11px]" />
                    {:else}
                      <i class="fa {statusIcon(!item.error ? item.status : 0)}"></i>
                    {/if}
                  </td>
                  <td class="py-0.5 px-1">
                    <input readonly value={item.name}
                      class="w-full bg-transparent border-none outline-none text-[11px] truncate
                        {item.status === STATE.DOWNLOAD ? 'text-white' : ''}
                        {item.status === STATE.SUCCESS  ? 'text-[#18BC9C]' : ''}" />
                  </td>
                  {#if item.error}
                    <td colspan="3" class="py-0.5 px-1">
                      <input readonly value={item.error}
                        class="w-full bg-transparent border-none outline-none text-[11px] text-red-500 font-bold truncate" />
                    </td>
                  {:else}
                    <td class="py-0.5 px-1 text-center">
                      <input readonly value={item.page}
                        class="w-full bg-transparent border-none outline-none text-center text-[11px]" />
                    </td>
                    <td class="py-0.5 px-1 text-center">
                      <input readonly value={item.language}
                        class="w-full bg-transparent border-none outline-none text-center text-[11px]" />
                    </td>
                    <td class="py-0.5 px-1 text-right">
                      <input readonly value={item.size}
                        class="w-full bg-transparent border-none outline-none text-right text-[11px]" />
                    </td>
                  {/if}
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

  {:else}
    <!-- ─── Landing / loading screen ─────────────────────────────────────── -->
    <div class="relative w-full h-full bg-contain bg-no-repeat"
      style="background-image: url({landingJpg})">
      <p class="absolute left-6 bottom-16 text-white font-bold text-[11px] drop-shadow">{pretext}</p>
      {#if exmsg}
        <div class="absolute top-1.5 right-1.5 flex gap-1">
          <button onclick={doReload}
            class="border border-sky-400 text-sky-400 px-1.5 py-0.5 text-[11px] hover:bg-sky-400 hover:text-white transition-colors">
            <i class="fa fa-refresh"></i>
          </button>
          <button onclick={() => window.close()}
            class="border border-red-400 text-red-400 px-1.5 py-0.5 text-[11px] hover:bg-red-400 hover:text-white transition-colors">
            <i class="fa fa-close"></i>
          </button>
        </div>
        <p class="absolute left-6 bottom-10 text-red-700 text-[11px] font-bold drop-shadow">{exmsg}</p>
      {/if}
    </div>
  {/if}

  <!-- ─── Footer bar ────────────────────────────────────────────────────── -->
  <div class="shrink-0 h-[5px] bg-[#324157]"></div>
</div>
