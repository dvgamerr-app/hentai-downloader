const request = require('request-promise')

export default (manga) => {
  let response = {
    username: 'e-hentai.org',
    text: manga.url,
    attachments: [
      {
        image_url: manga.cover,
        title: manga.name,
        fields: [
          {
            title: 'Language',
            value: manga.language,
            short: true
          },
          {
            title: 'Size',
            value: manga.size,
            short: true
          }
        ],
        text: `Total Images ${manga.page} files`
      }
    ]
  }

  return request({
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    url: 'https://hooks.slack.com/services/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',
    formData: { payload: JSON.stringify(response) }
  })
}

// export default (manga) => {
//   let response = {
//     username: 'e-hentai.org',
//     attachments: [
//       {
//         title: manga.name,
//         text: `${manga.url}
// ${manga.size} Total ${manga.page} files.`
//       }
//     ]
//   }

//   return request({
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     url: 'https://hooks.slack.com/services/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',
//     formData: { payload: JSON.stringify(response) }
//   })
// }
