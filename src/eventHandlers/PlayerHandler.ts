import Logger from '@bwatton/logger'
import { TextChannel, VoiceChannel, VoiceState } from 'discord.js'
import { Player, Track, TrackExceptionEvent, TrackStuckEvent, UnresolvedTrack, WebSocketClosedEvent } from 'erela.js'
import { Soup } from '../Soup'
import { codeBlock, Error, RichEmbed, Track as GuildTrack } from '../util'

export class PlayerHandler {

  private nowPlayingMessages: Map<string, string> = new Map()

  private logger: Logger = new Logger('PlayerHandler')

  constructor(private soup: Soup) {
    this.soup.manager.on('trackStart', (player, track) => this.onTrackStart(player, track))
    this.soup.manager.on('trackEnd', (player, track) => this.onTrackEnd(player, track))
    this.soup.manager.on('trackError', (player, track, payload) => this.onTrackError(player, track, payload))
    // this.soup.manager.on('playerMove', (player, initChannel, newChannel) => this.onPlayerMove(player, initChannel, newChannel))
    this.soup.manager.on('playerCreate', (player) => this.onPlayerCreate(player))
    this.soup.manager.on('playerDestroy', (player) => this.onPlayerDestroy(player))
    this.soup.manager.on('socketClosed', (player, payload) => this.onSocketClosed(player, payload))
    this.soup.manager.on('trackStuck', (player, track, payload) => this.onTrackStuck(player, track, payload))

    soup.on('voiceStateUpdate', (oldState, newState) => this.handleVoiceState(oldState, newState))
    soup.on('channelUpdate', (oldChannel: VoiceChannel, newChannel: VoiceChannel) => this.handleChannelUpdate(oldChannel, newChannel))
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

  private async onTrackError(player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel
    const guild = textChannel.guild

    textChannel.send({ embeds: [Error(`An error occured whilst trying to play \`${track.title}\`.`)] })

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A Lavalink error has occured whilst trying to play a track.', '', [
          ['Track', codeBlock(`${track.title} (${track.uri})`)],
          ['Error', codeBlock(payload.error)],
        ])
          .setAuthor(guild.name)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter(`GUILD ID: ${guild.id}`),
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

    this.logger.error(`Socket closed. Recreating player for guild ID: ${player.guild} `)

    // this.recreatePlayer(player)

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('Socket closed.', '', [
          ['Reason', codeBlock(payload.reason)],
          ['Code', codeBlock(payload.code)],
        ])
          .setAuthor(guild.name)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
    this.logger.error(`Socket closed. ${guild.name} (${guild.id}): ${payload.reason}`)
  }

  private async onTrackStuck(player: Player, track: Track, payload: TrackStuckEvent) {
    const guild = this.soup.guilds.cache.get(player.guild)

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A track has gotten stuck.', '', [])
          .setAuthor(guild.name)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
    this.logger.error(`A track has gotten stuck. ${guild.name} (${guild.id})`)
  }

  /*
  * A VERY hacky fix until erelajs fix their shit.
  *
  * Should only be used when the websocket dies during playing tracks.
  */
  private async recreatePlayer(oldPlayer: Player) {
    oldPlayer.destroy(false)

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    await sleep(500)

    const newPlayer = this.soup.manager.create(
      oldPlayer.options
    ).connect()

    if (oldPlayer.queue) {
      //@ts-ignore
      newPlayer.queue = oldPlayer.queue
      newPlayer.position = oldPlayer.position
    }

    if (oldPlayer.queue.current) {
      newPlayer.play(newPlayer.queue.current).then(() =>
        newPlayer.seek(oldPlayer.position)
      )
    }
  }

  // Some hacky things that might break happening down here

  private handleVoiceState(oldState: VoiceState, newState: VoiceState) {
    const channel = oldState.channel

    if (!channel) return

    if (oldState.id === this.soup.user.id && newState.id === this.soup.user.id) {
      if (!newState.channel) {
        const player = this.soup.manager.players.get(oldState.guild.id)
        player.destroy()
      }

      if (newState.serverMute == true && oldState.serverMute == false && oldState.member.id == this.soup.user.id) {
        const player = this.soup.manager.players.get(oldState.guild.id)
        player.pause(true)
        return
      }

      if (newState.serverMute == false && oldState.serverMute == true && oldState.member.id == this.soup.user.id) {
        const player = this.soup.manager.players.get(oldState.guild.id)
        player.pause(false)
        return
      }
    }
  }

  private async handleChannelUpdate(oldChannel: VoiceChannel, newChannel: VoiceChannel) {
    if (oldChannel.type === 'GUILD_VOICE' && newChannel.type === 'GUILD_VOICE') {
      const player = this.soup.manager.players.get(newChannel.guild.id);

      if (player) {
        if (player.voiceChannel === newChannel.id) {
          if (player.playing && !player.paused) {
            player.pause(true);
            const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
            await sleep(500)

            player.pause(false);
          }
        }
      }
    }
  }
}
