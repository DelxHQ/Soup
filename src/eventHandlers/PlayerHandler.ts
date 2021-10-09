import Logger from '@bwatton/logger'
import { Message, TextChannel } from 'discord.js'
import { Player, Track, TrackExceptionEvent, UnresolvedTrack } from 'erela.js'
import { Soup } from '../Soup'
import { Error, Track as GuildTrack } from '../util'


export class PlayerHandler {

  constructor(private soup: Soup) {}

  private logger: Logger = new Logger('PlayerHandler')

  private nowPlayingMessages: Map<string, Message> = new Map()

  public async init(): Promise<void> {
    await Promise.all([
      this.initListeners(),
    ])
  }

  private async initListeners() {
    this.soup.manager.on('trackStart', (player, track) => this.onTrackStart(player, track))
    this.soup.manager.on('trackEnd', (player, track) => this.onTrackEnd(player, track))
    this.soup.manager.on('trackError', (player, track, payload) => this.onTrackError(player, track, payload))
  }

  private async onTrackStart(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    const nowPlayingMessage = await textChannel.send({ embeds: [GuildTrack('Now Playing', track)] })

    this.nowPlayingMessages.set(textChannel.id, nowPlayingMessage)
  }

  private async onTrackEnd(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    const originalPlayingMessage = this.nowPlayingMessages.get(textChannel.id)

    if (originalPlayingMessage) originalPlayingMessage.delete()
  }

  private async onTrackError(player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    textChannel.send({ embeds: [Error(`An error occured whilst trying to play \`${track.title}\` Skipping to next track.`)] })

    this.logger.error(payload.exception)
  }
}