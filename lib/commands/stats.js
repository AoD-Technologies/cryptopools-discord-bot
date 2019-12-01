const Discord = require('discord.js')
const https = require('https')

const sortDescendingByPopularity = (aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate) => {
  // First sort by workers
  if (aWorkers < bWorkers) return 1
  if (aWorkers > bWorkers) return -1

  // Break ties with total hashrate
  const aTotalHashRate = aHashRate + aSoloHashRate
  const bTotalHashRate = bHashRate + bSoloHashRate

  if (aTotalHashRate < bTotalHashRate) return 1
  if (aTotalHashRate > bTotalHashRate) return -1

  return 0
}

const totalHashRateReducer = (accumulator, { hashrate, solohashrate }) => {
  return accumulator + hashrate + solohashrate
}

const byteUnits = [' KH', ' MH', ' GH', ' TH', ' PH', ' EH', ' ZH', ' YH']
const getReadableHashRateString = hashrate => {
  let i = -1
  do {
    hashrate = hashrate / 1024
    i++
  } while (hashrate > 1024)

  return hashrate.toFixed(2) + byteUnits[i]
}

async function runCommand (message, args, client) {
  const embed = new Discord.RichEmbed({})
  embed.setColor(0xECB22E)
  embed.setTitle('Statistics')
  embed.setDescription('Loading stats...')
  embed.setThumbnail('https://media.giphy.com/media/Fh28yu3oxWRlm/giphy.gif')
  embed.setAuthor(client.user.username)

  const m = await message.channel.send({ embed })

  https.get('https://api.cryptopools.aod-tech.com/api/stats', response => {
    let body = ''

    response.setEncoding('utf8')

    response.on('data', data => {
      body += data
    })

    response.on('end', async () => {
      try {
	const stats = JSON.parse(body)

        if (args.length === 0) {
          const topTenPools = Object.entries(stats.pools).sort(([, { workerCount: aWorkers, hashrate: aHashRate, solohashrate: aSoloHashRate }], [, { workerCount: bWorkers, hashrate: bHashRate, solohashrate: bSoloHashRate }]) => sortDescendingByPopularity(aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate)).slice(0, 10)

          const topTenAlgorithms = Object.entries(stats.algos).sort(([, { workers: aWorkers, hashrate: aHashRate, solohashrate: aSoloHashRate }], [, { workers: bWorkers, hashrate: bHashRate, solohashrate: bSoloHashRate }]) => sortDescendingByPopularity(aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate)).slice(0, 10)

          embed.setColor(0x2EB67D)
          embed.setDescription('')
          topTenPools.forEach(([name, details], i) => embed.addField(`#${i + 1} Pool`, `${name}, with ${details.workerCount} workers and a hash rate of ${getReadableHashRateString(details.hashrate + details.solohashrate)}.`))
          embed.addBlankField()
          topTenAlgorithms.forEach(([name, details], i) => embed.addField(`#${i + 1} Algorithm`, `${name}, with ${details.workers} workers and a hash rate of ${getReadableHashRateString(details.hashrate + details.solohashrate)}.`))
          embed.addBlankField()
          embed.addField('Total Workers', stats.global.workers)
          embed.addField('Total Hash Rate', getReadableHashRateString(Object.values(stats.algos).reduce(totalHashRateReducer, 0.0)))
          embed.setFooter('Data fetched from The Crypto Pools API')

          return
        } else if (args.length === 1) {
          const coin = args[0].toLowerCase()

          const relatedPoolData = Object.entries(stats.pools).filter(([name]) => name.split('-')[0].trim().toLowerCase() === coin)
          if (!relatedPoolData.length) {
            embed.setColor(0x36C5F0)
            embed.setDescription(`Could not find a pool for ${coin}.\n\nAre you sure it is a valid pool?`)

            return
          }

          embed.setColor(0x2EB67D)

          embed.addField('Daemon Version', relatedPoolData[0].poolStats.networkVersion)
          embed.addField('Block Height', relatedPoolData[0].poolStats.networkBlocks)
          if (relatedPoolData.length === 1) {
            embed.setDescription(`Detailed ${coin.substr(0, 1).toUpperCase()}${coin.substr(1)} Pool Statistics`)

            embed.addField('Network Difficulty', getReadableHashRateString(relatedPoolData[0].poolStats.networkDiff))
            embed.addField('Total Hash Rate', getReadableHashRateString(relatedPoolData[0].hashrate + relatedPoolData[0].solohashrate))
            embed.addField('Total Miners', relatedPoolData[0].workerCount)
            embed.addField('Blocks Pending', relatedPoolData[0].blocks.pending)
            embed.addField('Blocks Confirmed', relatedPoolData[0].blocks.confirmed)
            embed.addField('Blocks Orphaned', relatedPoolData[0].blocks.orphaned)
          } else {
            const topFivePools = relatedPools.sort(([, { workerCount: aWorkers, hashrate: aHashRate, solohashrate: aSoloHashRate }], [, { workerCount: bWorkers, hashrate: bHashRate, solohashrate: bSoloHashRate }]) => sortDescendingByPopularity(aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate)).slice(0, 5)

            embed.setDescription(`Detailed ${coin.substr(0, 1).toUpperCase()}${coin.substr(1)} Multi-Algorithm Pool Statistics`)

            embed.addBlankField()
            topFivePools.forEach(([name, details], i) => {
              embed.addField(`#${i + 1}: ${details.algorithm.substr(0, 1).toUpperCase()}${details.algorithm.substr(1)} Network Difficulty`, getReadableHashRateString(details.poolStats.networkDiff))
              embed.addField(`#${i + 1}: ${details.algorithm.substr(0, 1).toUpperCase()}${details.algorithm.substr(1)} Total Hash Rate`, getReadableHashRateString(details.hashrate + details.solohashrate))
              embed.addField(`#${i + 1}: ${details.algorithm.substr(0, 1).toUpperCase()}${details.algorithm.substr(1)} Total Miners`, details.workerCount)
              embed.addField(`#${i + 1}: ${details.algorithm.substr(0, 1).toUpperCase()}${details.algorithm.substr(1)} Blocks (Pending, Confirmed, Orphaned)`, `(${details.blocks.pending}, ${details.blocks.confirmed}, ${details.blocks.orphaned})`)
            })
          }
          embed.setFooter('Data fetched from The Crypto Pools API')

          return
        }

        embed.setColor(0x36C5F0)
        embed.setDescription('Incorrect usage of the stats command!\n\nEither use `!stats` for global pool stats, or `!stats <coin>` for detailed coin-specific pool stats!')
      } catch (e) {
        embed.setColor(0xE01E5A)
        embed.setDescription('Error loading stats! Please try again later.')
      } finally {
        try {
          m.edit({ embed })
        } catch (e) {
          console.error(e) // eslint-disable-line no-console
        }
      }
    })
  })
}

module.exports = runCommand
