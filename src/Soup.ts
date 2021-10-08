import { Client, ClientUser, Intents, ApplicationCommandManager, Interaction } from 'discord.js'
import { Command } from './Command'
import { PlayerManager } from './managers/PlayerManager'
import * as cmdList from './commands'
import Logger from '@bwatton/logger'
import { Manager, NodeOptions } from 'erela.js'
import Spotify from 'erela.js-spotify'

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
    host: process.env.LAVALINK_HOST,
    password: 'youshallnotpass',
    port: 2333,
  }]

  public manager = new Manager({
    nodes: this.lavalinkNodes,
    send: (id, payload) => { // what is this?
      const guild = this.guilds.cache.get(id)

      if (guild) guild.shard.send(payload)
    },
    plugins: [
      new Spotify({
        clientID: process.env.SPOTIFY_CLIENTID,
        clientSecret: process.env.SPOTIFY_CLIENTSECRET,
      }),
    ],
  })

  constructor(private loginToken: string) {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    })

    this.on('interactionCreate', interaction => this.onSlashCommand(interaction))
    // this.on('guildCreate', guild => this.onGuildJoin(guild))
    this.on('raw', d => {
      // this.logger.debug(d)
      this.manager.updateVoiceState(d)
    })

    this.manager.on('nodeError', (node, error) => {
      this.logger.info(`Node "${node.options.identifier}" encountered an error: ${error.message}`)
    })

    this.manager.on('nodeConnect', node => {
      this.logger.info(`Node "${node.options.identifier}" connected`)
    })
  }

  private get client() {
    return this.user as ClientUser
  }

  public async init(): Promise<void> {
    await this.login(this.loginToken)

    if (!this.user) {
      throw new Error('Error logging in to Discord - `user` undefined')
    }

    this.logger.info(`Logged in as ${this.client.username}`)

    this.manager.init(this.user.id)
    await this.loadCommands()

    let commands: ApplicationCommandManager

    // eslint-disable-next-line prefer-const
    commands = this.application.commands

    for (const command of this.cmds) {
      commands.create({
        name: command.name,
        description: command.description,
        options: command.options,
      })
    }
  }

  private async loadCommands() {
    const cmds = (cmdList as {
      [k: string]: Command,
    })
    for await (const command of Object.keys(cmds)) {
      const cmd = cmds[command]
      this.commands[cmd.name.toLowerCase()] = cmd
      this.cmds.push(cmd)
    }
  }

  private escape(str: string) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  public async sleep(n: number): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => resolve(), n * 1000)
    })
  }

  private async onSlashCommand(interaction: Interaction) {
    if (!interaction.isCommand()) return

    const cmd = this.commands[interaction.commandName]

    let player: PlayerManager
    if (this.playerInstances[interaction.guild.id]) {
      player = this.playerInstances[interaction.guild.id]
    } else {
      player = new PlayerManager(interaction.guild, this)
      this.playerInstances[interaction.guild.id] = player
    }

    const { options } = interaction

    try {
      cmd.run({
        soup: this,
        interaction,
        options,
        player,
      })
    } catch (error) {
      this.logger.error(error)
      interaction.reply({ content: 'There was an error trying to run this command.', ephemeral: true })
    }
  }
}