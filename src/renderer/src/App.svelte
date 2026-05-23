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
<div class="flex flex-col w-full h-screen overflow-hidden font-sans text-xs text-gray-700 bg-gray-50 select-none">

  {#if !landing}

    <!-- ─── Toolbar ───────────────────────────────────────────────────────── -->
    <div class="shrink-0 bg-[#2C3E50] text-white">

      {#if page.signin}
        <!-- Cookie sign-in form -->
        <form class="flex gap-3 px-3 py-2.5" onsubmit={onSignIn}>
          <div class="flex-1 text-[10px] leading-[1.5] border-r border-white/15 pr-3 overflow-hidden">
            <p class="text-white/70 mb-1">
              เข้าใช้ <a href="javascript:void(0)" class="text-[#18BC9C] underline font-bold"
                onclick={(e) => { e.preventDefault(); window.electron.shell.openExternal(_SERVER_WIKI) }}>exhentai.org</a>
              &nbsp;กด <code class="bg-white/15 px-1 rounded">F12</code>
              → <code class="bg-white/15 px-1 rounded">Console</code>
              → พิมพ์ <code class="bg-white/15 px-1 rounded">copy(document.cookie)</code>
              → <code class="bg-white/15 px-1 rounded">ENTER</code>
              แล้ว <code class="bg-white/15 px-1 rounded">Ctrl+V</code> ด้านขวา
            </p>
            {#if error_message}
              <p class="flex items-center gap-1 text-red-300 font-medium mt-1">
                <i class="fa fa-exclamation-circle shrink-0"></i>
                <span class="truncate">{error_message}</span>
              </p>
            {/if}
          </div>

          {#if !state_signin}
            <div class="w-40 flex flex-col justify-center gap-1.5 shrink-0">
              <input
                id="txtCookie" type="text" placeholder="Paste cookie here"
                bind:value={sign.cookie}
                class="border border-white/25 bg-white/10 px-2 py-1 text-[10px] text-white outline-none
                  placeholder-white/35 focus:border-[#18BC9C] focus:bg-white/15 transition-colors rounded-sm"
              />
              <button type="submit"
                class="flex items-center gap-1.5 bg-[#18BC9C] text-white px-2 py-1 text-[10px] font-medium
                  hover:bg-[#16a085] transition-colors self-start rounded-sm">
                <i class="fa fa-floppy-o"></i>Save
              </button>
            </div>
          {:else}
            <div class="w-40 flex items-center justify-center gap-2 shrink-0">
              <i class="fa fa-circle-o-notch fa-spin text-white/50"></i>
              <span class="text-[10px] text-white/50">Signing in...</span>
            </div>
          {/if}
        </form>

      {:else}
        <!-- Save path row -->
        <div class="flex items-center h-7 px-3 gap-2 border-b border-white/10">
          <i class="fa fa-folder-o text-white/40 shrink-0 text-[10px]"></i>
          {#if directory_name}
            <span class="flex-1 truncate text-[10px] text-white/55 min-w-0">{directory_name}</span>
          {:else}
            <span class="flex-1 truncate text-[10px] text-white/30 italic min-w-0">No directory selected</span>
          {/if}
          <div class="flex items-center gap-0.5 shrink-0">
            {#if sign.name}
              <span class="text-white/40 text-[10px] mr-2">
                <i class="fa fa-user-circle-o mr-0.5"></i>{getHideName(sign.name)}
              </span>
            {/if}
            <button title="Join Discord Community"
              onclick={() => window.electron.shell.openExternal(_SERVER_COMMUNITY)}
              class="w-6 h-6 flex items-center justify-center text-sky-300/70 hover:text-sky-300 hover:bg-white/10 transition-colors rounded-sm">
              <i class="fa fa-comments-o text-[11px]"></i>
            </button>
            <button title="Donate ❤"
              onclick={() => window.electron.shell.openExternal(_SERVER_DONATE)}
              class="w-6 h-6 flex items-center justify-center text-red-300/70 hover:text-red-300 hover:bg-white/10 transition-colors rounded-sm">
              <i class="fa fa-heart text-[11px]"></i>
            </button>
            <button
              disabled={state_verify || state_name === 'Loading...'}
              onclick={() => { page.signin = true }}
              class="h-6 px-2 text-[10px] font-medium transition-colors rounded-sm
                {state_verify || state_name === 'Loading...'
                  ? 'text-white/25 cursor-not-allowed'
                  : 'text-yellow-300/80 hover:text-yellow-300 hover:bg-white/10'}">
              <i class="fa fa-key mr-0.5"></i>Cookie
            </button>
          </div>
        </div>

        <!-- URL input / progress row -->
        {#if !page.option}
          <div class="flex items-center gap-1.5 px-3 py-2">
            <div class="flex-1 min-w-0">
              {#if !state_verify}
                <div class="relative">
                  <i class="fa fa-link absolute left-2 top-1/2 -translate-y-1/2 text-white/25 text-[10px] pointer-events-none"></i>
                  <input
                    bind:this={urlRef}
                    id="txtURL" type="text" bind:value={url}
                    placeholder={!sign.name
                      ? 'https://e-hentai.org/g/...'
                      : 'https://exhentai.org/g/...'}
                    maxlength="80"
                    onkeyup={(e) => e.key === 'Enter' && onQueue()}
                    class="w-full bg-white/10 border {error_message ? 'border-red-400/70' : 'border-white/20'}
                      pl-6 pr-2 py-1.5 text-[11px] text-white outline-none rounded-sm
                      placeholder-white/25 focus:border-[#18BC9C] focus:bg-white/15 transition-colors"
                  />
                </div>
              {:else}
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] text-white/50 truncate">{state_msg}</span>
                    <span class="text-[10px] text-[#18BC9C] font-medium shrink-0 ml-2">{barPct}%</span>
                  </div>
                  <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-[#18BC9C] h-full rounded-full transition-all duration-300" style="width:{barPct}%"></div>
                  </div>
                </div>
              {/if}
            </div>

            <div class="flex gap-1 shrink-0">
              <button
                disabled={state_verify || (!directory_name && state_name === 'Download')}
                onclick={onQueue}
                class="flex items-center gap-1.5 h-8 px-3 text-[11px] font-medium rounded-sm transition-colors
                  {!state_verify
                    ? 'bg-[#18BC9C] text-white hover:bg-[#16a085] shadow-sm'
                    : 'bg-white/10 text-white/35 cursor-not-allowed'}
                  disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fa {state_icon}"></i>{state_name}
              </button>
              <button
                title={state_name !== 'Loading...' ? 'Settings' : 'Cancel download'}
                disabled={state_verify && state_name !== 'Loading...'}
                onclick={onCancel}
                class="w-8 h-8 flex items-center justify-center rounded-sm transition-colors
                  {state_name === 'Loading...'
                    ? 'text-red-400 bg-red-400/15 hover:bg-red-400/25'
                    : 'text-white/45 hover:bg-white/10 hover:text-white'}
                  disabled:opacity-25 disabled:cursor-not-allowed">
                <i class="fa {state_name !== 'Loading...' ? 'fa-gear' : 'fa-times'} text-xs"></i>
              </button>
              <button
                title="History"
                disabled={state_verify || state_name === 'Loading...'}
                class="w-8 h-8 flex items-center justify-center text-white/35 hover:bg-white/10 hover:text-white/70 rounded-sm transition-colors
                  disabled:opacity-25 disabled:cursor-not-allowed">
                <i class="fa fa-history text-xs"></i>
              </button>
            </div>
          </div>

        {:else}
          <!-- Directory picker -->
          <div class="flex items-center gap-1.5 px-3 py-2">
            <i class="fa fa-folder-open-o text-white/40 shrink-0 text-[11px]"></i>
            <input
              type="text" readonly bind:value={directory_name}
              placeholder="Select a download directory..."
              class="flex-1 min-w-0 bg-white/10 border border-white/20 px-2 py-1.5 text-[11px] text-white
                outline-none placeholder-white/30 rounded-sm"
            />
            <button onclick={onBrowse}
              class="bg-sky-500 text-white px-3 h-8 text-[11px] font-medium hover:bg-sky-400 transition-colors rounded-sm shrink-0">
              Browse
            </button>
            <button title="Back" onclick={() => { page.option = false }}
              class="w-8 h-8 flex items-center justify-center border border-white/20 text-white/45
                hover:border-white/40 hover:text-white transition-colors rounded-sm shrink-0">
              <i class="fa fa-arrow-left text-xs"></i>
            </button>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Error message bar -->
    {#if error_message && !page.signin && !state_verify}
      <div class="shrink-0 flex items-center gap-2 bg-red-50 border-b border-red-200 px-3 py-1.5">
        <i class="fa fa-exclamation-circle text-red-400 shrink-0 text-[11px]"></i>
        <span class="text-[10px] text-red-600 font-medium truncate">{error_message}</span>
      </div>
    {/if}

    <!-- ─── Queue Table ──────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden bg-white">
      <div class="overflow-y-auto overflow-x-hidden flex-1">
        <table class="w-full border-collapse table-fixed">
          <colgroup>
            <col style="width:6%">
            <col style="width:55%">
            <col style="width:10%">
            <col style="width:13%">
            <col style="width:16%">
          </colgroup>
          <thead class="sticky top-0 z-10 bg-gray-100 border-b border-gray-200">
            <tr>
              <th class="py-2 px-2 text-center font-semibold text-[9px] text-gray-400 uppercase tracking-wider">#</th>
              <th class="py-2 px-2 font-semibold text-left text-[9px] text-gray-400 uppercase tracking-wider">Name</th>
              <th class="py-2 px-2 text-center font-semibold text-[9px] text-gray-400 uppercase tracking-wider">Pages</th>
              <th class="py-2 px-2 text-center font-semibold text-[9px] text-gray-400 uppercase tracking-wider">Lang</th>
              <th class="py-2 px-2 text-right font-semibold text-[9px] text-gray-400 uppercase tracking-wider pr-3">Size</th>
            </tr>
          </thead>
          <tbody>
            {#if manga.length === 0}
              <tr>
                <td colspan="5" class="text-center py-14">
                  <div class="flex flex-col items-center gap-2">
                    <i class="fa fa-inbox text-gray-200 text-4xl"></i>
                    <span class="text-gray-400 text-[11px] font-medium">Queue is empty</span>
                    <span class="text-gray-300 text-[10px]">Paste a gallery URL to begin</span>
                  </div>
                </td>
              </tr>
            {:else}
              {#each manga as item, i}
                <tr class="border-b border-gray-100 transition-colors
                  {i % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}
                  {state_download && item.status === STATE.DOWNLOAD ? '!bg-emerald-50 !border-emerald-100' : ''}
                  {state_download && item.status === STATE.SUCCESS  ? '!bg-emerald-50/40' : ''}
                  hover:bg-blue-50/40">
                  <td class="py-1.5 px-2 text-center">
                    {#if !state_download}
                      <span class="text-gray-300 text-[10px] font-medium">{i + 1}</span>
                    {:else}
                      <i class="fa {statusIcon(!item.error ? item.status : 0)} text-[11px]
                        {item.status === STATE.SUCCESS  ? 'text-[#18BC9C]' : ''}
                        {item.status === STATE.DOWNLOAD ? 'text-[#18BC9C]' : ''}
                        {item.status === STATE.FAIL     ? 'text-red-400' : ''}
                        {item.status === STATE.PREPARE  ? 'text-gray-300' : ''}"></i>
                    {/if}
                  </td>
                  <td class="py-1.5 px-2 min-w-0">
                    <span class="block truncate text-[11px]
                      {state_download && item.status === STATE.DOWNLOAD ? 'text-[#18BC9C] font-medium' : ''}
                      {item.status === STATE.SUCCESS && state_download   ? 'text-[#18BC9C]' : ''}
                      {item.status === STATE.FAIL                        ? 'text-red-400'   : ''}
                      {item.status === STATE.PREPARE || !state_download  ? 'text-gray-700'  : ''}">
                      {item.name}
                    </span>
                  </td>
                  {#if item.error}
                    <td colspan="3" class="py-1.5 px-2">
                      <span class="flex items-center gap-1 text-[10px] text-red-400">
                        <i class="fa fa-exclamation-triangle shrink-0"></i>
                        <span class="truncate italic">{item.error}</span>
                      </span>
                    </td>
                  {:else}
                    <td class="py-1.5 px-2 text-center text-[10px] text-gray-500">{item.page ?? ''}</td>
                    <td class="py-1.5 px-2 text-center text-[10px] text-gray-500">{item.language ?? ''}</td>
                    <td class="py-1.5 px-2 text-right text-[10px] text-gray-400 pr-3">{item.size ?? ''}</td>
                  {/if}
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Status Bar ────────────────────────────────────────────────────── -->
    <div class="shrink-0 h-[18px] bg-[#2C3E50] px-3 flex items-center justify-between gap-2">
      <span class="text-[9px] text-white/40 truncate flex items-center gap-1">
        {#if state_download}
          <i class="fa fa-circle-o-notch fa-spin shrink-0"></i>
          <span class="truncate">{state_msg}</span>
        {:else if manga.length > 0}
          <i class="fa fa-list shrink-0"></i>
          <span>{manga.length} item{manga.length !== 1 ? 's' : ''} in queue</span>
        {:else}
          <i class="fa fa-info-circle shrink-0"></i>
          <span>Ready — paste or type a gallery URL</span>
        {/if}
      </span>
      <div class="shrink-0 flex items-center gap-2">
        {#if state_download}
          <span class="text-[9px] text-[#18BC9C] font-medium">{barPct}%</span>
        {:else if directory_name}
          <span class="text-[9px] text-white/25 truncate max-w-[120px]">
            <i class="fa fa-folder-o mr-0.5"></i>{directory_name.split(/[/\\]/).pop()}
          </span>
        {/if}
      </div>
    </div>

  {:else}
    <!-- ─── Landing / loading screen ─────────────────────────────────────── -->
    <div class="relative w-full h-full bg-cover bg-center"
      style="background-image: url({landingJpg})">
      <div class="absolute inset-0 bg-[#2C3E50]/55"></div>

      <!-- Loading indicator -->
      <div class="absolute left-0 right-0 bottom-14 px-6 flex items-center gap-2.5">
        {#if !exmsg}
          <i class="fa fa-circle-o-notch fa-spin text-white/60 text-sm shrink-0"></i>
        {:else}
          <i class="fa fa-exclamation-triangle text-red-400 text-sm shrink-0"></i>
        {/if}
        <span class="text-white text-[11px] font-medium drop-shadow">{pretext}</span>
      </div>

      {#if exmsg}
        <p class="absolute left-6 bottom-7 text-red-300 text-[10px] drop-shadow">{exmsg}</p>
        <div class="absolute top-3 right-3 flex gap-1.5">
          <button onclick={doReload}
            class="flex items-center gap-1.5 bg-sky-500/80 text-white px-2.5 py-1.5 text-[11px] font-medium
              hover:bg-sky-500 transition-colors rounded-sm backdrop-blur-sm">
            <i class="fa fa-refresh"></i>Retry
          </button>
          <button onclick={() => window.close()}
            class="flex items-center gap-1.5 bg-red-500/80 text-white px-2.5 py-1.5 text-[11px] font-medium
              hover:bg-red-500 transition-colors rounded-sm backdrop-blur-sm">
            <i class="fa fa-times"></i>Close
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
