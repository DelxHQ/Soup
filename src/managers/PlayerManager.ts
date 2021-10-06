import { Guild as GuildClass, TextChannel } from 'discord.js'
import { Soup } from '../Soup'
import { LoadType } from '../types/types'
import { Player, TrackUtils } from 'erela.js'
import { RichEmbed, Track } from '../util/helpers'

export interface GuildTrack {
  id: string
  title: string,
  author: string,
  link: string,
  thumb: string | null,
  duration: string,
  track: string,
}

export class PlayerManager {

  public get id() {
    return this.guild.id
  }

  public get player() {
    return this.realPlayer
  }

  public set player(player: Player | null) {
    if (this.realPlayer) {
      this.realPlayer.stop()
      // this.realPlayer.disconnect()
      // this.realPlayer.destroy()
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

  public get currentTrack() {
    if (this.track < 0 || !this.queue[this.track]) return null

    return this.queue[this.track]
  }

  constructor(public guild: GuildClass, private soup: Soup) { }

  public queue: GuildTrack[] = []
  public queueChannel: TextChannel | null = null
  public loop: 'off' | 'queue' | 'track' = 'off'
  private realPlayer: Player | null = null
  private track: number = -1

  public async initPlayer(textChannelId: string, voiceChannelId: string) {
    if (this.realPlayer) return this.realPlayer

    return this.player = this.soup.manager.create({
      guild: this.guild.id,
      voiceChannel: voiceChannelId,
      textChannel: textChannelId,
      selfDeafen: true
    }).connect()
  }

  public enqueue(track: GuildTrack) {
    const index = this.queue.push(track)

    return index
  }

  public play(track: number) {
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

  public skipSong() {
    if (!this.realPlayer) return null

    const track = this.queue[this.track + 1] || null

    this.realPlayer.stop()

    return track
  }

  public clearQueue() {
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
            playlist: null
          })
        case LoadType.PLAYLIST_LOADED:
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

  public duration(ms: number) {
    let hours = ms / (1000 * 60 * 60)
    let absoluteHours = Math.floor(hours)
    let h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours

    let minutes = (hours - absoluteHours) * 60
    let absoluteMinutes = Math.floor(minutes)
    let m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes

    let seconds = (minutes - absoluteMinutes) * 60
    let absoluteSeconds = Math.floor(seconds)
    let s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds

    return h + ':' + m + ':' + s;
  }

  private lavalinkToGuildTrack(llTrack: any): GuildTrack {
    const { track, identifier, author, duration, title, uri } = llTrack

    return {
      track,
      id: identifier,
      author,
      duration: this.duration(duration),
      title,
      link: uri,
      thumb: `https://img.youtube.com/vi/${identifier}/maxresdefault.jpg`,
    }
  }
}