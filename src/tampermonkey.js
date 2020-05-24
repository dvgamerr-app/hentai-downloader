// ==UserScript==
// @name         HentaiDownloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict'
  const port = '34841'
  const script = document.createElement('script')

  const addDownloadIcon = () => {
    const addIcon = (element) => {
      const eDL = document.createElement('span')
      eDL.style = 'padding:10px 15px;font-size:0.7rem;background-color:rgba(0, 0, 0, 0.55);color:#ffffff;cursor:pointer;font-weight:bold;font-family:"Segoe UI";display:block;'
      eDL.onclick = () => {
        eDL.remove()
      }
      const eI = document.createElement('i')
      const eText = document.createTextNode(' Download')
      eI.classList = 'fa fa-download'
      eDL.appendChild(eI)
      eDL.appendChild(eText)
      element.insertBefore(eDL, element.firstChild)
    }
    for (const gl1t of Array.from(document.getElementsByClassName('gl1t'))) {
      addIcon(gl1t)
    }
    for (const gl1e of Array.from(document.getElementsByClassName('gl1e'))) {
      addIcon(gl1e)
    }
  }

  const api = (name, data) => fetch(`http://localhost:${port}/${name}`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  })

  script.onload = async () => {
    try {
      const res = await api('token', { cookie: document.cookie })
      const { token } = await res.json()
      if (token) {
        addDownloadIcon()
      }
    } catch (ex) {
      //
    }
  }
  script.src = 'https://use.fontawesome.com/abbe6cd72d.js'
  document.getElementsByTagName('head')[0].appendChild(script)
})()
