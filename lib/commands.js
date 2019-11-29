const { chatHooks } = require('./ChatHooks')

module.exports = async (message, client) => {
  if (message.author.bot) return

  chatHooks(message)

  if (message.content.indexOf('!') !== 0) return

  const args = message.content.slice(1).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  const rawArgs = args.join(' ')

  switch (command) {
    case 'help':
      require('./commands/help')(message, args, client)
      break
    case 'ping':
      require('./commands/ping')(message, args, client)
      break
    case 'stats':
      require('./commands/stats')(message, args, client)
      break
    case 'invite':
      require('./commands/invite')(message, args, client)
      break
    default:
      break
  }
}
