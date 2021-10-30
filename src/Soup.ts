import { Client, ClientUser, Guild, GuildChannel, GuildMember, Intents, Interaction, TextChannel } from 'discord.js'
import { Command } from './Command'
import * as cmdList from './commands'
import Logger from '@bwatton/logger'
import { Manager, NodeOptions } from 'erela.js'
import Spotify from 'better-erela.js-spotify'
import { PlayerHandler } from './eventHandlers/PlayerHandler'
import { Error as ErrorEmbed, RichEmbed } from './util'
import { ServerlistManager } from './managers/ServerlistManager'

interface IChannels {
  logs: TextChannel,
}

export class Soup extends Client {

  public static DEV_MODE = false

  private logger: Logger = new Logger('Bot')

  public commands: {
    [k: string]: Command,
  } = {}

  public cmds: Command[] = []

  public soupChannels: IChannels

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
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    })

    this.on('interactionCreate', interaction => this.onSlashCommand(interaction))
    this.on('guildCreate', guild => this.onGuildJoin(guild))
    this.on('guildDelete', guild => this.onGuildLeave(guild))
    // this.on('voiceStateUpdate', (oldState, newState) => this.logger.debug(`OLDSTATE: ${oldState.toJSON()}, NEWSTATE: ${newState.toJSON()}`))
    this.on('warn', message => this.logger.warn(message))
    this.on('error', error => this.logger.error(error))
    this.on('raw', d => this.manager.updateVoiceState(d))

    this.manager.on('nodeError', (node, error) => {
      this.logger.info(`Lavalink node "${node.options.identifier}" encountered an error: ${error.message}`)
    })

    this.manager.on('nodeConnect', node => {
      this.logger.info(`Lavalink node "${node.options.identifier}" connected`)
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

    this.soupChannels = {
      logs: await this.getChannel<TextChannel>(process.env.LOGS_CHANNEL),
    }

    this.manager.init(this.user.id)

    await this.loadCommands()

    new PlayerHandler(this).init()
    
    const listManager = new ServerlistManager(this)

    this.logger.info(`Logged in and ready as ${this.client.username}`)

    this.soupChannels.logs.send({
      embeds: [
        RichEmbed('Soup has started up.', '', [
          ['Guilds', `\`\`\`${this.guilds.cache.size}\`\`\``],
        ]),
      ],
    })

    setInterval(async() => await listManager.sendServerCount(), 300 * 1000)
    setInterval(() => {
      this.user.setActivity(`music in ${this.manager.players.size} guilds`, { type: 'PLAYING' })
    }, 120 * 1000)
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
        options: options as any,
      })
    } catch (error) {
      this.logger.error(error)
      interaction.reply({ content: 'There was an error trying to run this command.', ephemeral: true })
    }
  }

  private async onGuildJoin(guild: Guild) {
    this.soupChannels.logs.send({
      embeds: [
        RichEmbed('Soup added to new guild', '', [
          ['Name', `\`\`\`${guild.name}\`\`\``],
          ['Members', `\`\`\`${guild.memberCount}\`\`\``],
        ], '', 'BLURPLE')
          .setFooter(`GUILD ID ${guild.id}`)
          .setThumbnail(guild.iconURL({ dynamic: true })),
      ],
    })
    this.logger.info(`Added to a new guild. ${guild.name} (${guild.id})`)
  }

  private async onGuildLeave(guild: Guild) {
    this.soupChannels.logs.send({
      embeds: [
        RichEmbed('Soup removed from guild', '', [
          ['Name', `\`\`\`${guild.name}\`\`\``],
          ['Members', `\`\`\`${guild.memberCount}\`\`\``],
        ], '', 'RED')
          .setFooter(`GUILD ID ${guild.id}`)
          .setThumbnail(guild.iconURL({ dynamic: true })),
      ],
    })
    this.logger.info(`Removed from a guild. ${guild.name} (${guild.id})`)
  }

  private async getChannel<T extends GuildChannel = GuildChannel>(id: string) {
    return await this.channels.fetch(id) as T
  }
}