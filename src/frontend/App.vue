<script>
export default {
  data: () => ({
    message: 'Hello'
  })
}
</script>

<template>
  <div id="app">
    <div />
    <div class="overview-view">
      <div class="container-fluid">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style lang="css">
  .padding-content {
    padding-top: 1.5em;
  }
  .menu-grid {
    grid-area: menu;
  }
  .navbar-grid {
    grid-area: nav;
  }
  .overview-view {
    background-color: #fbfbfb;
    grid-area: main;
    overflow: auto;
  }
</style>
