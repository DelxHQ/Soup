import { Soup } from './Soup'

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not set in ENV')
if (!process.env.SPOTIFY_CLIENTID) throw new Error('SPOTIFY_CLIENTID is not set in ENV')
if (!process.env.SPOTIFY_CLIENTSECRET) throw new Error('SPOTIFY_CLIENTSECRET is not set in ENV')

;(async() => {
  await new Soup(process.env.DISCORD_TOKEN).init()
})()