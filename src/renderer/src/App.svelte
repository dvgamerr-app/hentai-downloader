<script>
  import Versions from './components/Versions.svelte'

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<div class="creator">Powered by electron-vite</div>
<div class="text">
  Build an Electron app with
  <span class="svelte">Svelte</span>
</div>
<p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
<div class="actions">
  <div class="action">
    <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
  </div>
  <div class="action">
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_missing_attribute -->
    <a target="_blank" rel="noreferrer" onclick={ipcHandle}>Send IPC</a>
  </div>
</div>
<Versions />
