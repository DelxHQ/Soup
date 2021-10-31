import dotenv from 'dotenv'
import { Soup } from './Soup'

dotenv.config()

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not set in ENV')
if (!process.env.SPOTIFY_CLIENTID) throw new Error('SPOTIFY_CLIENTID is not set in ENV')
if (!process.env.SPOTIFY_CLIENTSECRET) throw new Error('SPOTIFY_CLIENTSECRET is not set in ENV')
if (!process.env.LAVALINK_HOST) throw new Error('LAVALINK_HOST is not set in ENV')

;(async() => {
  const soup = new Soup(process.env.DISCORD_TOKEN)
  soup.init()

  // process.on('uncaughtException', async () => {
  //   soup.cmds = []
  //   soup.commands = {}
  //   soup.init()
  // })
  //   .on('unhandledRejection', async () => {
  //     soup.cmds = []
  //     soup.commands = {}
  //     soup.init()
  //   })
})()
