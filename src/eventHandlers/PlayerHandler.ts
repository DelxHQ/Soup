import Logger from '@bwatton/logger'
import { TextChannel } from 'discord.js'
import { Player, Track, TrackExceptionEvent, TrackStuckEvent, UnresolvedTrack, WebSocketClosedEvent } from 'erela.js'
import { Soup } from '../Soup'
import { codeBlock, Error, RichEmbed, Track as GuildTrack } from '../util'

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class PlayerHandler {

  private nowPlayingMessages: Map<string, string> = new Map()

  private logger: Logger = new Logger(this.constructor.name)

  constructor(private soup: Soup) {
    this.soup.manager.on('trackStart', (player, track) => this.onTrackStart(player, track))
    this.soup.manager.on('trackEnd', (player, track) => this.onTrackEnd(player, track))
    this.soup.manager.on('queueEnd', (player) => this.onQueueEnd(player))
    this.soup.manager.on('trackError', (player, track, payload) => this.onTrackError(player, track, payload))
    this.soup.manager.on('playerMove', (player, initChannel, newChannel) => this.onPlayerMove(player, initChannel, newChannel))
    this.soup.manager.on('playerCreate', (player) => this.onPlayerCreate(player))
    this.soup.manager.on('playerDestroy', (player) => this.onPlayerDestroy(player))
    this.soup.manager.on('socketClosed', (player, payload) => this.onSocketClosed(player, payload))
    this.soup.manager.on('trackStuck', (player, track, payload) => this.onTrackStuck(player, track, payload))

    // soup.on('voiceStateUpdate', (oldState, newState) => this.handleVoiceState(oldState, newState))
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
  }

  // Apparently the trackEnd event isn't fired whenever the last track in the queue ends
  private async onQueueEnd(player: Player) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    this.deleteNowPlayingMessage(textChannel)
  }

  private async onTrackError(player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel
    const guild = textChannel.guild

    textChannel.send({ embeds: [RichEmbed('', `An error occured whilst trying to play \`${track.title}\`.`, [
      ['Error', `\`${payload.error}\``],
    ])]})

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A Lavalink error has occured whilst trying to play a track.', '', [
          ['Track', codeBlock(`${track.title} (${track.uri})`)],
          ['Error', codeBlock(payload.error)],
        ])
          .setAuthor({ name: guild.name })
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({ text: `GUILD ID: ${guild.id}` }),
      ],
    })
    this.logger.error(`A Lavalink error has occured whilst trying to play a track. ${guild.name} (${guild.id}): ${payload.exception}`)

    this.deleteNowPlayingMessage(textChannel)
  }

  private async onPlayerMove(player: Player, initChannel: string, newChannel: string) {
    player.setVoiceChannel(newChannel)

    player.pause(true)
    setTimeout(() => player.pause(false), 500)
  }

  private async onPlayerDestroy(player: Player) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    this.deleteNowPlayingMessage(textChannel)

    // const messages = (await textChannel.messages.fetch({ limit: 100 })).filter(
    //   m => m.type === 'APPLICATION_COMMAND',
    // )
    // if (!messages) return

    // textChannel.bulkDelete(messages, true)

    // if (!textChannel.guild) return

    textChannel.send({embeds: [
      RichEmbed('Thank you for using Soup!', 'Please consider voting for Soup if it did well over at [TOP.GG](https://top.gg/bot/893245033208217621/vote)! This will help boost Soups popularity.', [])
        .setURL('https://top.gg/bot/893245033208217621/vote')
        .setThumbnail(this.soup.user.avatarURL({ dynamic: true })),
    ]})

    this.logger.info(`Destroyed player for ${textChannel.guild.name} (${textChannel.guild.name})`)
  }

  private async deleteNowPlayingMessage(channel: TextChannel) {
    const guildChannel = await this.soup.channels.fetch(channel.id) as TextChannel
    const originalPlayingMessage = await guildChannel.messages.fetch(this.nowPlayingMessages.get(channel.id))

    if (this.nowPlayingMessages.has(channel.id)) {
      this.nowPlayingMessages.delete(channel.id)

      if (originalPlayingMessage)
        originalPlayingMessage.delete()
    }
  }

  private async onSocketClosed(player: Player, payload: WebSocketClosedEvent) {
    const guild = this.soup.guilds.cache.get(player.guild)
    const guildChannel = await this.soup.channels.fetch(player.textChannel) as TextChannel

    switch(payload.code) {
      case 4014:
        player.destroy()
        break
      default:
        this.recreatePlayer(player)
    }

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('Socket closed.', '', [
          ['Reason', codeBlock(payload.reason)],
          ['Code', codeBlock(payload.code)],
        ])
          .setAuthor({ name: guild.name })
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({ text: `GUILD ID: ${guild.id}` }),
      ],
    })
    this.logger.error(`Socket closed. ${guild.name} (${guild.id}): ${payload.reason}`)
  }

  private async onTrackStuck(player: Player, track: Track, payload: TrackStuckEvent) {
    const guild = this.soup.guilds.cache.get(player.guild)
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    textChannel.send({
      embeds: [
        Error(`Cannot continue playing ${player.queue.current.title} as it has gotten stuck.`),
      ],
    })

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A track has gotten stuck.', '', [])
          .setAuthor({ name: guild.name })
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({ text: `GUILD ID: ${guild.id}` }),
      ],
    })
    this.logger.error(`A track has gotten stuck. ${guild.name} (${guild.id})`)
  }

  /*
  * A VERY hacky fix until erelajs fix their shit.
  *
  * Should only be used when the websocket dies during playback.
  */
  private async recreatePlayer(oldPlayer: Player) {
    oldPlayer.destroy()

    await sleep(500)

    const newPlayer = this.soup.manager.create(
      oldPlayer.options,
    ).connect()

    if (oldPlayer.queue) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      newPlayer.queue = oldPlayer.queue
      newPlayer.position = oldPlayer.position
    }

    if (oldPlayer.queue.current) {
      newPlayer.play(newPlayer.queue.current).then(async () => {
        await sleep(500)
        newPlayer.seek(oldPlayer.position)
      })
    }
  }

  // private handleVoiceState(oldState: VoiceState, newState: VoiceState) {
  //   const channel = oldState.channel
  //   const guildPlayer = this.soup.manager.players.get(oldState.guild.id)

  //   if (!channel) guildPlayer.destroy()

  //   if (oldState.id === this.soup.user.id && newState.id === this.soup.user.id) {
  //     if (newState.serverMute && !oldState.serverMute && oldState.member.id == this.soup.user.id)
  //       guildPlayer.pause(true)

  //     if (!newState.serverMute && oldState.serverMute && oldState.member.id == this.soup.user.id)
  //       guildPlayer.pause(false)
  //   }
  // }
}
