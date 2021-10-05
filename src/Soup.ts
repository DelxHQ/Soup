import { Client, Message as DMessage, ClientUser, Intents, Guild } from 'discord.js'
import { Command } from './Command'
import { PlayerManager } from './managers/PlayerManager'
import * as cmdList from './commands'
import Logger from '@bwatton/logger'
import { Manager, NodeOptions } from 'erela.js'

export class Soup extends Client {

  public static DEV_MODE = true

  private logger: Logger = new Logger('Bot')

  public commands: {
    [k: string]: Command,
  } = {}

  private playerInstances: {
    [k: string]: PlayerManager,
  } = {}

  public cmds: Command[] = []

  public lavalinkNodes: NodeOptions[] = [{
    identifier: 'lavalink-eu-1',
    host: 'localhost',
    password: 'youshallnotpass',
    port: 2333,
  }]

  public manager = new Manager({
    nodes: this.lavalinkNodes,
    send: (id, payload) => { // what is this?
      const guild = this.guilds.cache.get(id)

      if (guild) guild.shard.send(payload)
    }
  })

  constructor(private loginToken: string) {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
      ]
    })

    this.on('messageCreate', message => this.onMessageReceived(message))

    this.on('raw', d => this.manager.updateVoiceState(d))

    this.manager.on('nodeError', (node, error) => {
      this.logger.info(`Node "${node.options.identifier}" encountered an error: ${error.message}`)
    })

    this.manager.on("nodeConnect", node => {
      this.logger.info(`Node "${node.options.identifier}" connected`)
    })
  }

  private get client() {
    return this.user as ClientUser
  }

  public async init() {
    await this.login(this.loginToken)

    if (!this.user) {
      throw new Error('Error logging in to Discord - `user` undefined')
    }

    this.logger.info(`Logged in as ${this.client.username}`)

    this.manager.init(this.user.id)
    await this.loadCommands()
  }

  private async loadCommands() {
    const cmds = (cmdList as {
      [k: string]: Command,
    })
    for await (const command of Object.keys(cmds)) {
      const cmd = cmds[command]
      this.commands[cmd.name.toLowerCase()] = cmd
      this.cmds.push(cmd)

      if (cmd.aliases) {
        for await (const alias of cmd.aliases) {
          this.commands[alias] = cmd
        }
      }
    }
  }

  private escape(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  public async sleep(n: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => resolve(), n * 1000)
    })
  }

  private async onMessageReceived(message: DMessage) {
    if (!message.guild) return

    const prefix = '!'

    if (
      message.content &&
      (
        (message.content.startsWith(prefix) && message.content.trim() !== prefix) ||
        (message.content.startsWith(`<@!${this.client.id}>`) && message.content.trim() !== `<@!${this.client.id}>`) ||
        (message.content.startsWith(`<@${this.client.id}>`) && message.content.trim() !== `<@${this.client.id}>`)
      )
    ) {
      const content = message.content
        .replace(new RegExp(`^(${this.escape(prefix)})`, 'gim'), '')
        .replace(new RegExp(`^(<@!?${this.client.id}>)`, 'gim'), '')
        .trim()
      const contentParts = content.split(/\s/gm)
      const cmdStr = contentParts[0].toLowerCase()
      const args = contentParts.slice(1)

      if (!this.commands[cmdStr]) return

      let player: PlayerManager
      if (this.playerInstances[message.guild.id]) {
        player = this.playerInstances[message.guild.id]
      } else {
        player = new PlayerManager(message.guild, this)
        this.playerInstances[message.guild.id] = player
      }

      const cmd = this.commands[cmdStr]

      await cmd.run({
        soup: this,
        message,
        args,
        player,
      })
    }
  }
}