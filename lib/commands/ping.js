const https = require('https')

async function runCommand (message, args, client) {
  const m = await message.channel.send('Ping?')
  const startDate = Date.now()
  https.get('https://api.cryptopools.aod-tech.com/api/stats', response => {
    let body = ''

    response.setEncoding('utf8')

    response.on('data', data => {
      body += data
    })

    response.on('end', async () => {
      try {
	JSON.parse(body)
        const receiveDate = Date.now()
        await m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. Discord API Latency is ${Math.round(client.ping)}ms. The Crypto Pools API Latency is ${receiveDate - startDate}ms`)
      } catch (e) {
        console.error(e)
      }
    })
  })
}

module.exports = runCommand

