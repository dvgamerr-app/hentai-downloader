const request = require('request-promise')

export function logs (name, message) {
  let response = {
    username: name,
    text: message,
    mrkdwn: true
  }
  if (process.env.NODE_ENV !== 'development') {
    return request({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: 'https://hooks.slack.com/services/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',
      formData: { payload: JSON.stringify(response) }
    })
  } else {
    console.log(name, message)
  }
}

export function slack (name, manga) {
  let response = {
    username: name,
    text: `*${manga.name}*\n${manga.language} -- Size: ${manga.size} (${manga.page} pages)\n${manga.url}`,
    mrkdwn: true,
    attachments: [
      { image_url: manga.cover }
    ]
  }

  if (process.env.NODE_ENV !== 'development') {
    return request({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      url: 'https://hooks.slack.com/services/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',
      formData: { payload: JSON.stringify(response) }
    })
  } else {
    console.log(`${manga.name}
${manga.language} -- Size: ${manga.size} (${manga.page} pages)
${manga.url}`)
  }
}
