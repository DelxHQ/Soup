import { Soup } from './Soup'

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not set in ENV')
if (!process.env.OAUTH_SECRET) throw new Error('OAUTH_SECRET is not set in ENV')
if (!process.env.SPOTIFY_CLIENTID) throw new Error('SPOTIFY_CLIENTID is not set in ENV')
if (!process.env.SPOTIFY_CLIENTSECRET) throw new Error('SPOTIFY_CLIENTSECRET is not set in ENV')
if (!process.env.LAVALINK_HOST) throw new Error('LAVALINK_HOST is not set in ENV')
if (!process.env.LAVALINK_PORT) throw new Error('LAVALINK_PORT is not set in ENV')

;(async() => {
  await new Soup(process.env.DISCORD_TOKEN).init()
})()