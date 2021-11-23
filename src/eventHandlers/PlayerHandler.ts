import Logger from '@bwatton/logger'
import { TextChannel } from 'discord.js'
import { Player, Track, TrackExceptionEvent, TrackStuckEvent, UnresolvedTrack, WebSocketClosedEvent } from 'erela.js'
import { Soup } from '../Soup'
import { codeBlock, Error, RichEmbed, Track as GuildTrack } from '../util'

export class PlayerHandler {

  constructor(private soup: Soup) { }

  private nowPlayingMessages: Map<string, string> = new Map()

  private logger: Logger = new Logger('PlayerHandler')


  public async init(): Promise<void> {
    await Promise.all([
      this.initListeners(),
    ])
  }

  private async initListeners() {
    this.soup.manager.on('trackStart', (player, track) => this.onTrackStart(player, track))
    this.soup.manager.on('trackEnd', (player, track) => this.onTrackEnd(player, track))
    this.soup.manager.on('trackError', (player, track, payload) => this.onTrackError(player, track, payload))
    this.soup.manager.on('playerMove', (player, initChannel, newChannel) => this.onPlayerMove(player, initChannel, newChannel))
    this.soup.manager.on('playerCreate', (player) => this.onPlayerCreate(player))
    this.soup.manager.on('playerDestroy', (player) => this.onPlayerDestroy(player))
    this.soup.manager.on('socketClosed', (player, payload) => this.onSocketClosed(player, payload))
    this.soup.manager.on('trackStuck', (player, track, payload) => this.onTrackStuck(player, track, payload))
  }

  private async onPlayerCreate(player: Player) {
    const guild = this.soup.guilds.cache.get(player.guild)

    this.logger.info(`Created player for ${guild.name} (${guild.id})`)
  }

  private async onTrackStart(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    const nowPlayingMessage = await textChannel.send({ embeds: [GuildTrack('Now Playing', track)] })

    this.nowPlayingMessages.set(textChannel.id, nowPlayingMessage.id)
  }

  private async onTrackEnd(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    this.deleteNowPlayingMessage(textChannel)

    if (!player.queue.length && player.trackRepeat) {
      player.setTrackRepeat(false)
    } else if (!player.queue.length && player.queueRepeat) {
      player.setQueueRepeat(false)
    }
  }

  private async onTrackError(player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel
    const guild = textChannel.guild

    textChannel.send({ embeds: [Error(`An error occured whilst trying to play \`${track.title}\`.`)] })

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A Lavalink error has occured whilst trying to play a track.', '', [
          ['Track', `\`\`\`${track.title} (${track.uri})\`\`\``],
          ['Error', `\`\`\`${payload.exception}\`\`\``],
        ]).setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
    this.logger.error(`A Lavalink error has occured whilst trying to play a track. ${guild.name} (${guild.id}): ${payload.exception}`)

    this.deleteNowPlayingMessage(textChannel)
  }

  private async onPlayerMove(player: Player, initChannel: string, newChannel: string) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    if (!newChannel) { // Assume we've been disconnected from the voice channel
      this.deleteNowPlayingMessage(textChannel)

      return player.destroy()
    }

    player.setVoiceChannel(newChannel)
  }

  private async onPlayerDestroy(player: Player) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    this.deleteNowPlayingMessage(textChannel)

    this.logger.info(`Destroyed player for ${textChannel.guild.name} (${textChannel.guild.name})`)
  }

  private async deleteNowPlayingMessage(channel: TextChannel) {
    const originalPlayingMessage = await channel.messages.fetch(this.nowPlayingMessages.get(channel.id))

    if (this.nowPlayingMessages.has(channel.id)) {
      this.nowPlayingMessages.delete(channel.id)
      if (originalPlayingMessage) {
        originalPlayingMessage.delete()
      }
    }
  }

  private async onSocketClosed(player: Player, payload: WebSocketClosedEvent) {
    const guild = this.soup.guilds.cache.get(player.guild)

    /*
    * A VERY hacky fix until erelajs fix their shit.
    */

    if (payload.code === 4000) {
      this.logger.error(`Payload code 4000 received. Recreating player for guild ID: ${player.guild} `)

      player.destroy()

      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
      await sleep(500)

      const newPlayer = this.soup.manager.create({
        guild: player.guild,
        voiceChannel: player.options.voiceChannel,
        textChannel: player.options.textChannel,
        selfDeafen: true,
      }).connect()

      if (player.queue) {
        //@ts-ignore
        newPlayer.queue = player.queue
        newPlayer.position = player.position
      }
      await newPlayer.play(newPlayer.queue.current)
      newPlayer.seek(player.position)
    }

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('Socket closed.', '', [
          ['Reason', codeBlock(payload.reason)],
          ['Code', codeBlock(payload.code)],
        ]).setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
    this.logger.error(`Socket closed. ${guild.name} (${guild.id}): ${payload.reason}`)
  }

  private async onTrackStuck(player: Player, track: Track, payload: TrackStuckEvent) {
    const guild = this.soup.guilds.cache.get(player.guild)

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A track has gotten stuck.', '', [])
          .setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
    this.logger.error(`A track has gotten stuck. ${guild.name} (${guild.id})`)
  }
}
