import { Client, ClientUser, Guild, GuildChannel, GuildMember, Intents, Interaction, Permissions, TextChannel } from 'discord.js'
import { Command } from './Command'
import * as cmdList from './commands'
import Logger from '@bwatton/logger'
import { Manager, NodeOptions } from 'erela.js'
import Spotify from 'better-erela.js-spotify'
import AppleMusic from 'better-erela.js-apple'
import { PlayerHandler } from './eventHandlers/PlayerHandler'
import { codeBlock, Error as ErrorEmbed, RichEmbed, secondsToDhms } from './util'

interface IChannels {
  logs: TextChannel,
  statistics: TextChannel,
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
    host: process.env.LAVALINK_HOST,
    password: 'youshallnotpass',
    port: parseInt(process.env.LAVALINK_PORT, 10) || 2333,
    retryAmount: Number.MAX_VALUE,
  }]

  public manager = new Manager({
    nodes: this.lavalinkNodes,
    defaultSearchPlatform: 'youtube',
    send: (id, p) => this.ws.shards.get(this.guildToShard(id, this.ws.shards.size)).send(p),
    plugins: [
      new AppleMusic(),
      new Spotify({
        strategy: 'API',
        clientId: process.env.SPOTIFY_CLIENTID,
        clientSecret: process.env.SPOTIFY_CLIENTSECRET,
        convertUnresolved: false,
        albumPageLimit: 30,
        playlistPageLimit: 30,
        showPageLimit: 30,
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
      statistics: await this.getChannel<TextChannel>(process.env.STATISTICS_CHANNEL),
    }

    this.manager.init(this.user.id)

    await this.loadCommands()

    new PlayerHandler(this)

    if (process.env.LOGS_CHANNEL) {
      this.soupChannels.logs.send({
        embeds: [
          RichEmbed('Soup has started up.', '', [
            ['Guilds', `\`\`\`${this.guilds.cache.size}\`\`\``],
          ]),
        ],
      })
    } else {
      this.logger.warn('No logging channel set. Skipping.')
    }

    this.on('interactionCreate', interaction => this.onSlashCommand(interaction))
    this.on('guildCreate', guild => this.onGuildJoin(guild))
    this.on('guildDelete', guild => this.onGuildLeave(guild))
    this.on('warn', message => this.logger.warn(message))
    this.on('error', error => this.logger.error(error))
    this.on('raw', d => this.manager.updateVoiceState(d))

    this.doStatistics()

    setInterval(() => {
      this.user.setActivity(`music in ${this.manager.nodes.first().stats.players} guilds`, { type: 'PLAYING' })
    }, 120 * 1000)

    this.logger.info(`Logged in and ready as ${this.client.username}`)
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

    if (!this.hasBasicPermissions(interaction.channel as TextChannel)) {
      interaction.reply({
        embeds: [
          ErrorEmbed(`I don't have permissions to function in the ${interaction.channel} channel.`),
        ], ephemeral: true,
      })
      return
    }

    try {
      if (cmd.voiceOnly && !(interaction.member as GuildMember).voice.channel) {
        return interaction.reply({ embeds: [ErrorEmbed(`You need to be in a voice channel to run the \`${cmd.name}\` command.`)], ephemeral: true })
      } else if (this.manager.players.get(interaction.guild.id)) {
        if (
          cmd.voiceOnly &&
          (interaction.member as GuildMember).voice.channel.id != this.manager.players.get(interaction.guild.id).voiceChannel
        ) {
          return interaction.reply({ embeds: [ErrorEmbed(`You need to be in the same voice as the player to run the \`${cmd.name}\` command.`)], ephemeral: true })
        }
      }

      cmd.run({
        soup: this,
        interaction,
        options: interaction.options as any,
      })
    } catch (error) {
      this.logger.error(error)
      interaction.reply({ content: 'There was an error trying to run this command.', ephemeral: true })
    }
  }

  private async onGuildJoin(guild: Guild) {
    if (!process.env.LOGS_CHANNEL) return this.logger.warn('No logging channel set. Skipping.')

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
    if (!process.env.LOGS_CHANNEL) return this.logger.warn('No logging channel set. Skipping.')

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

    const guildPlayer = this.manager.players.get(guild.id)

    if (guildPlayer) guildPlayer.destroy()

    this.logger.info(`Removed from a guild. ${guild.name} (${guild.id})`)
  }

  private async getChannel<T extends GuildChannel = GuildChannel>(id: string) {
    return await this.channels.fetch(id) as unknown as T
  }

  private hasBasicPermissions(channel: TextChannel) {
    const selfPermissions = channel.permissionsFor(channel.guild.members.cache.find(m => m.id === this.user.id))

    const permissionsNeeded = [
      Permissions.FLAGS.SEND_MESSAGES,
      Permissions.FLAGS.EMBED_LINKS,
      Permissions.FLAGS.ADD_REACTIONS,
      Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
      Permissions.FLAGS.USE_EXTERNAL_STICKERS,
    ]

    for (const permission of permissionsNeeded) {
      if (!selfPermissions.has(permission)) {
        return false
      }
    }
    return true
  }

  private async doStatistics() {
    const messages = (await this.soupChannels.statistics.messages.fetch())
      .map(m => m)
      .filter(m => m.author.id == this.user.id)

    for (const message of messages) {
      message.delete()
    }

    const message = await this.soupChannels.statistics.send('`Awaiting statistics...`')

    const playingPlayers = this.manager.players.filter(p => p.playing).size

    setInterval(() => {
      const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024
      message.edit({
        embeds: [
          RichEmbed('Statistics', '', [
            ['Guilds', codeBlock(this.guilds.cache.size)],
            ['Players', codeBlock(this.manager.nodes.first().connected ? this.manager.players.size : 'Node not connected.')],
            ['Playing Players', codeBlock(this.manager.nodes.first().connected ? playingPlayers : 'Node not connected.')],
            ['Total Lavalink Nodes', codeBlock(this.manager.nodes.size)],
            ['Memory Usage', codeBlock(Math.round(memoryUsed * 100) / 100 + 'MB')],
            ['Gateway Ping', codeBlock(this.ws.ping + 'ms')],
            ['Uptime', codeBlock(secondsToDhms(this.uptime / 1000))],
          ], null, 'YELLOW'),
        ], content: null,
      })
    }, 25 * 1000)
  }

  private guildToShard(id: string, shards: number) {
    return Number((BigInt(id) >> 22n) % BigInt(shards))
  }
}

