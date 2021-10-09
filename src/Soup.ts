import { Client, ClientUser, GuildMember, Intents, Interaction } from 'discord.js'
import { Command } from './Command'
import * as cmdList from './commands'
import Logger from '@bwatton/logger'
import { Manager, NodeOptions } from 'erela.js'
import Spotify from 'better-erela.js-spotify'
import { PlayerHandler } from './eventHandlers/PlayerHandler'
import { Error as ErrorEmbed } from './util'

export class Soup extends Client {

  public static DEV_MODE = false

  private logger: Logger = new Logger('Bot')

  public commands: {
    [k: string]: Command,
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
        strategy: 'API',
        clientId: process.env.SPOTIFY_CLIENTID,
        clientSecret: process.env.SPOTIFY_CLIENTSECRET,
      })],
  })

  constructor(private loginToken: string) {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    })

    this.on('interactionCreate', interaction => this.onSlashCommand(interaction))
    this.on('raw', d => this.manager.updateVoiceState(d))

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

    new PlayerHandler(this).init()

    if (Soup.DEV_MODE) {
      const devCommands = this.guilds.cache.get(process.env.DEV_GUILD).commands

      for (const command of this.cmds) {
        devCommands.create({
          name: command.name,
          description: command.description,
          options: command.options,
        })
      }
    }

    /*
    * TODO: This needs to become a script.
    */

    // let commands: ApplicationCommandManager

    // commands = this.application.commands
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
    const { options } = interaction

    try {
      if (cmd.voiceOnly && !(interaction.member as GuildMember).voice.channel) {
        return interaction.reply({ embeds: [ErrorEmbed(`You need to be in a voice channel to run the \`${cmd.name}\` command.`)], ephemeral: true })
      }
      cmd.run({
        soup: this,
        interaction,
        options,
      })
    } catch (error) {
      this.logger.error(error)
      interaction.reply({ content: 'There was an error trying to run this command.', ephemeral: true })
    }
  }
}