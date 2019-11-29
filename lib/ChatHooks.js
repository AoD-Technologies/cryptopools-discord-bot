const hooks = [
  {
    triggers: ['rage quit'],
    responses: [
      'https://media.giphy.com/media/s0FsE5TsEF8g8/giphy.gif'
    ]
  },
  {
    triggers: ['crashed'],
    responses: [
      'https://media0.giphy.com/media/p4nfVvYi7Odw8FjdDU/giphy.gif',
      'https://media.giphy.com/media/zrdUjl6N99nLq/200.gif',
      'https://img2.thejournal.ie/inline/2433923/original/?width=282&version=2433923'
    ]
  }
]

let triggerChecks = hooks.reduce((curr = [], i) => {
  if (curr.triggers) { return curr.triggers.concat(i.triggers) }
  return curr.concat(i.triggers)
})

function chatHooks (message) {
  triggerChecks.forEach((trigger) => {
    if (message.content.indexOf(trigger) > -1) {
      let hook = hooks.find(h => h.triggers.includes(trigger))
      if (hook) {
        let random = Math.floor(Math.random() * ((hook.responses.length - 1) + 1))
        message.reply(hook.responses[random])
      }
    }
  })
}

module.exports = {
  chatHooks
}
