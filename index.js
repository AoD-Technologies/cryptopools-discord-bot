require('dotenv').config()

const Discord = require('discord.js')
const http = require('http')

const commandParser = require('./lib/commands')

const debugPrint = (message) => {
  console.log('\x1b[36m%s\x1b[0m', `[CRYPTOPOOLS BOT] - ${message}`) // eslint-disable-line no-console
}

const badRequest = response => {
  response.writeHead(400, {
    'content-type': 'text/plain'
  })

  response.end('Bad Request')
}

const notFound = response => {
  response.writeHead(404, {
    'content-type': 'text/plain'
  })

  response.end('Not Found')
}

const internalServerError = response => {
  response.writeHead(500, {
    'content-type': 'text/plain'
  })

  response.end('Internal Server Error')
}

const readJSONBody = request => {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', data => {
      body += data
    })

    request.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        reject(e)
      }
    })
  })
}

const client = new Discord.Client()

// Discord client
client.on('ready', () => {
  debugPrint('BOT STARTED!')

  const channel = client.channels.find(({ name }) => name === process.env.MONITOR_CHANNEL)

  const server = http.createServer(async (request, response) => {
    try {
      const pathParts = request.url.split('/').slice(1)
      switch (pathParts[0]) {
        case 'cryptopools': // /cryptopools
          switch (pathParts[1]) {
            case 'found-block': // /cryptopools/found-block/{coin}
              if (request.method === 'POST') {
                const coin = pathParts[2]
                const body = await readJSONBody(request)

                if (!body.miner || !body.type || !body.url) {
                  badRequest(response)
                  return
                }

                const embed = new Discord.RichEmbed({})
                embed.setTitle('Block Discovered')
                embed.setColor(0x2EB67D)
                embed.setDescription(`Congratulations!\nThe ${coin} pool has found a new block!\n\nThis block was found by ${body.miner} while ${body.type} mining!`)
                embed.setURL(body.url)
                embed.setAuthor(client.user.username)
                embed.setThumbnail('https://media.giphy.com/media/QN6NnhbgfOpoI/giphy.gif')

                const m = await channel.send({ embed })
                m.react(m.guild.emojis.find(({ name }) => name.toLowerCase() === coin.split('-')[0].trim().toLowerCase()))

                return
              }
              break
            case 'sent-payment': // /cryptopools/sent-payment/{coin}
              if (request.method === 'POST') {
                const coin = pathParts[2]
                const body = await readJSONBody(request)

                if (!body.amount || !body.symbol || !body.blocks || !body.blocks.length || !body.miners) {
                  badRequest(response)
                  return
                }

                const embed = new Discord.RichEmbed({})
                embed.setTitle('Pool Payout Sent')
                embed.setColor(0x2EB67D)
                embed.setDescription(`The ${coin} pool has sent a payment of ${body.amount} ${body.symbol} for block${body.blocks.length !== 1 ? 's' : ''} ${body.blocks.join(', ')} to ${body.miners} miner${body.miners !== 1 ? 's' : ''}!`)
                embed.setURL(body.url)
                embed.setAuthor(client.user.username)
                embed.setThumbnail('https://i.gifer.com/HbGh.gif')

                const m = await channel.send({ embed })
                m.react(m.guild.emojis.find(({ name }) => name.toLowerCase() === coin.split('-')[0].trim().toLowerCase()))

                return
              }
              break
            default:
              break
          }
          break
        default:
          break
      }

      notFound(response)
    } catch (e) {
      console.error(e) // eslint-disable-line no-console

      internalServerError(response)
    }
  })

  server.listen(parseInt(process.env.PORT), '127.0.0.1')
  debugPrint('SERVER STARTED!')

  client.user.setActivity('The Crypto Pools', {
    type: 'WATCHING'
  })
})

client.on('message', async (message) => {
  commandParser(message, client)
})

client.login(process.env.DISCORD_KEY)
