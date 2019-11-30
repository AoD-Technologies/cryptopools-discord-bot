const Discord = require('discord.js')
const r2 = require('r2')

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

async function runCommand (message) {
  const embed = new Discord.RichEmbed({})
  embed.setColor(0xECB22E)
  embed.setTitle('Statistics')
  embed.setDescription('Loading stats...')
  embed.setThumbnail('https://media.giphy.com/media/Fh28yu3oxWRlm/giphy.gif')

  const m = await message.channel.send({ embed })
  try {
    const stats = await r2.get('https://api.cryptopools.aod-tech.com/api/stats').json

    const topTenPools = Object.entries(stats.pools).sort(([, { workerCount: aWorkers, hashrate: aHashRate, solohashrate: aSoloHashRate }], [, { workerCount: bWorkers, hashrate: bHashRate, solohashrate: bSoloHashRate }]) => sortDescendingByPopularity(aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate)).slice(0, 10)

    const topTenAlgorithms = Object.entries(stats.algos).sort(([, { workers: aWorkers, hashrate: aHashRate, solohashrate: aSoloHashRate }], [, { workers: bWorkers, hashrate: bHashRate, solohashrate: bSoloHashRate }]) => sortDescendingByPopularity(aWorkers, aHashRate, aSoloHashRate, bWorkers, bHashRate, bSoloHashRate)).slice(0, 10)

    embed.setColor(0x2EB67D)
    embed.setDescription('')
    topTenPools.forEach(([name, details], i) => embed.addField(`#${i + 1} Pool`, `${name}, with ${details.workerCount} workers and a hash rate of ${getReadableHashRateString(details.hashrate + details.solohashrate)}`))
    embed.addBlankField()
    topTenAlgorithms.forEach(([name, details], i) => embed.addField(`#${i + 1} Algorithm`, `${name}, with ${details.workers} workers and a hash rate of ${getReadableHashRateString(details.hashrate + details.solohashrate)}`))
    embed.addBlankField()
    embed.addBlankField()
    embed.addField('Total Workers', stats.global.workers)
    embed.addField('Total Hash Rate', getReadableHashRateString(Object.values(stats.algos).reduce(totalHashRateReducer, 0.0)))
    embed.setFooter('Data fetched from **The Crypto Pools API**')
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
}

module.exports = runCommand
