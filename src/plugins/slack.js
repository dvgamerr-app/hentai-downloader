const request = require('request-promise')

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
//      url: 'https://hooks.slack.com/services/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',
//     formData: { payload: JSON.stringify(response) }
//   })
// }

export default (name, manga) => {
  let response = {
    username: name,
    text: `*${manga.name}*\n${manga.language} -- Size: ${manga.size} (${manga.page} pages)\n${manga.url}`,
    mrkdwn: true,
    attachments: [
      { image_url: manga.cover }
    ]
  }

  return request({
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    url: 'https://hooks.slack.com/services/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',
    formData: { payload: JSON.stringify(response) }
  })
}
