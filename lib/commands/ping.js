const r2 = require('r2')

async function runCommand (message, args, client) {
  const m = await message.channel.send('Ping?')
  const startDate = (new Date()).getTime()
  await r2.get('https://api.cryptopools.aod-tech.com/api/stats').json
  const receiveDate = (new Date()).getTime()
  m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. Discord API Latency is ${Math.round(client.ping)}ms. The Crypto Pools API Latency is ${receiveDate - startDate}ms`)
}

module.exports = runCommand
