import { Guild as GuildClass, TextChannel } from 'discord.js'
import { Soup } from '../Soup'
import { LoadType } from '../types/types'
import { Player, TrackUtils } from 'erela.js'
import { Track } from '../util/helpers'

export interface GuildTrack {
  id: string
  title: string,
  author: string,
  link: string,
  thumbnail: string | null,
  duration: string,
  track: string,
}

export class PlayerManager {

  public get id(): string {
    return this.guild.id
  }

  public get player(): Player {
    return this.realPlayer
  }

  public set player(player: Player | null) {
    if (this.realPlayer) {
      this.realPlayer.stop()
      this.realPlayer.disconnect()
      this.realPlayer.destroy()
    }

    this.realPlayer = player
    if (!player) return

    this.player.manager.on('queueEnd', () => {
      if (this.track > -1 && this.queue[this.track + 1]) {
        const trackIndex = ++this.track
        this.play(trackIndex + 1)
      } else if (this.loop === 'track') {
        this.play(this.track + 1)
      } else if (this.loop === 'queue') {
        this.play(1)
      } else {
        // if (this.queueChannel) this.queueChannel.send({ embeds: [RichEmbed('End of queue, leaving channel')] })
        this.player = null
        this.queueChannel = null
        this.queue = []
      }
    })
  }

  public get currentTrack(): GuildTrack {
    if (this.track < 0 || !this.queue[this.track]) return null

    return this.queue[this.track]
  }

  constructor(public guild: GuildClass, private soup: Soup) { }

  public queue: GuildTrack[] = []
  public queueChannel: TextChannel | null = null
  public loop: 'off' | 'queue' | 'track' = 'off'
  private realPlayer: Player | null = null
  private track = -1

  public async initPlayer(textChannelId: string, voiceChannelId: string): Promise<Player> {
    if (this.realPlayer) return this.realPlayer

    return this.player = this.soup.manager.create({
      guild: this.guild.id,
      voiceChannel: voiceChannelId,
      textChannel: textChannelId,
      selfDeafen: true,
    }).connect()
  }

  public enqueue(track: GuildTrack): number {
    const index = this.queue.push(track)

    return index
  }

  public play(track: number): number {
    if (!this.player) return

    this.track = track - 1

    const unresolvedTrack = TrackUtils.buildUnresolved({
      title: this.queue[this.track].title,
      author: this.queue[this.track].author,
    })

    this.player.play(unresolvedTrack)

    const currentTrack = this.queue[this.track]

    this.player.manager.once('trackStart', () => {
      if (this.queueChannel) this.queueChannel.send({ embeds: [Track('Now Playing', currentTrack)] })
    })
  }

  public skipSong(): GuildTrack {
    if (!this.realPlayer) return null

    const track = this.queue[this.track + 1] || null

    this.realPlayer.stop()

    return track
  }

  public clearQueue(): void {
    if (!this.realPlayer) return

    this.queue = []
    this.player.stop()
  }

  public async searchTrack(query: string): Promise<{
    tracks: GuildTrack[],
    playlist: { name: string } | null
  }> {
    return new Promise(async resolve => {
      const res = await this.player.search(query)
      switch (res.loadType.toUpperCase()) {
        case LoadType.TRACK_LOADED:
        case LoadType.SEARCH_RESULT:
          console.log(res.tracks[0])
          return resolve({
            tracks: [this.lavalinkToGuildTrack(res.tracks[0])],
            playlist: null,
          })
        case LoadType.PLAYLIST_LOADED:
          console.log(res.tracks)
          return resolve({
            tracks: res.tracks.map((t: any) => this.lavalinkToGuildTrack(t)),
            playlist: {
              name: res.playlist.name,
            },
          })
        default:
          return resolve({
            tracks: [],
            playlist: null,
          })
      }
    })
  }

  public duration(ms: number): string {
    const hours = ms / (1000 * 60 * 60)
    const absoluteHours = Math.floor(hours)
    const h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours

    const minutes = (hours - absoluteHours) * 60
    const absoluteMinutes = Math.floor(minutes)
    const m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes

    const seconds = (minutes - absoluteMinutes) * 60
    const absoluteSeconds = Math.floor(seconds)
    const s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds

    return h + ':' + m + ':' + s
  }

  private lavalinkToGuildTrack(llTrack: any): GuildTrack {
    const { track, identifier, author, duration, title, uri, thumbnail } = llTrack

    return {
      track,
      id: identifier,
      author,
      duration: this.duration(duration),
      title,
      link: uri,
      thumbnail,
    }
  }
}