require('dotenv').config()

const Discord = require('discord.js')
const http = require('http')
const url = require('url')

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

  const channel = client.channels.find('name', process.env.MONITOR_CHANNEL)
  const server = http.createServer(async (request, response) => {
    try {
      const pathParts = new url.URL(request.url).path.split('/').slice(1)
      switch (pathParts[0]) {
        case 'cryptopools': // /cryptopools
          switch (pathParts[1]) {
            case 'found-block': // /cryptopools/found-block/{coin}
              if (request.method === 'POST') {
                const coin = pathParts[2]
                const body = await readJSONBody(request)

                if (!body.miner || !body.url) {
                  badRequest(response)
                  return
                }

                const embed = new Discord.RichEmbed({})
                embed.setTitle('Block Discovered')
                embed.setColor(0x00AE86)
                embed.setDescription(`Congratulations!\nA new ${coin} block has been found by ${body.miner}!`)
                embed.setURL(body.url)
                embed.setAuthor(client.user.username)
                embed.setThumbnail('https://media.giphy.com/media/QN6NnhbgfOpoI/giphy.gif')
                channel.send({ embed })

                return
              }
              break
            case 'sent-payment': // /cryptopools/sent-payment/{coin}
              if (request.method === 'POST') {
                const coin = pathParts[2]
                const body = await readJSONBody(request)

                if (!body.blocks || !body.blocks.length || !body.miners) {
                  badRequest(response)
                  return
                }

                const embed = new Discord.RichEmbed({})
                embed.setTitle('Payment Sent')
                embed.setColor(0x00AE86)
                embed.setDescription(`A payment has been sent for ${coin} block${body.blocks.length !== 1 ? 's' : ''} ${body.blocks.join(', ')} to ${body.miners} miners.!`)
                embed.setURL(body.url)
                embed.setAuthor(client.user.username)
                embed.setThumbnail('https://media.giphy.com/media/VTxmwaCEwSlZm/giphy.gif')
                channel.send({ embed })

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

  server.listen(parseInt(process.env.PORT))
  debugPrint('SERVER STARTED!')

  client.user.setActivity('Monitoring The Crypto Pools')
})

client.on('message', async (message) => {
  commandParser(message, client)
})

client.login(process.env.DISCORD_KEY)
