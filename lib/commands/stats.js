const r2 = require('r2')

async function runCommand (message) {
  const m = await message.channel.send('Loading stats...')
  try {
    const stats = await r2.get('https://api.cryptopools.aod-tech.com/api/stats').json
    m.edit('```\n' + JSON.stringify(stats, undefined, 2) + '\n```')
  } catch (e) {
    m.edit('Error loading stats! Please try again later.')
  }
}

module.exports = runCommand
