module.exports = {
  packagerConfig: { icon: './src/icons/icon.ico' },
  // plugins: [
  //   ['@electron-forge/plugin-webpack', {
  //     mainConfig: { entry: './src/main.js' },
  //     renderer: {
  //       config: './webpack/renderer.config.js',
  //       entryPoints: [
  //         {
  //           name: 'main_window',
  //           html: './src/index.html',
  //           js: './src/renderer.js'
  //         }
  //       ]
  //     }
  //   }]
  // ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'hentai_downloader'
      }
    },
    { name: '@electron-forge/maker-zip', platforms: [ 'darwin' ] },
    { name: '@electron-forge/maker-deb', config: {} },
    { name: '@electron-forge/maker-rpm', config: {} },
    // {
    //   name: '@electron-forge/publisher-github',
    //   config: {
    //     repository: { owner: 'touno-io', name: 'hentai-downloader' },
    //     prerelease: true
    //   }
    // }
  ]
}
