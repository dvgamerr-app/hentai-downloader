const request = require('request-promise')

export function update (name, message) {
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