import { Guild as GuildClass, TextChannel } from 'discord.js'
import { URLSearchParams } from 'url'
import { Soup } from '../Soup'
import { LoadType } from '../types/types'
import fetch from 'node-fetch'
import { Player, TrackUtils } from 'erela.js'
import { Track } from '../util/helpers'


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
      this.realPlayer.destroy()
    }

    this.realPlayer = player
    if (!player) return
  }

  constructor(public guild: GuildClass, private soup: Soup) { }

  public queue: GuildTrack[] = []
  public queueChannel: TextChannel | null = null
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
    if (this.queueChannel) this.queueChannel.send({ embeds: [Track('Now Playing', currentTrack)] })
  }

  public async searchTrack(query: string): Promise<{
    tracks: GuildTrack[],
    playlist: { name: string } | null
  }> {
    return new Promise(async resolve => {
      const node = this.soup.manager.nodes.first().options

      let identifier: string

      if (query.startsWith('http://') || query.startsWith('https://')) {
        identifier = `identifier=${encodeURI(query)}`
      } else {
        const params = new URLSearchParams()
        params.append('identifier', `ytsearch: ${query}`)
        identifier = params.toString()
      }

      fetch(`http://${node.host}:${node.port}/loadtracks?${identifier}`, {
        headers: {
          Authorization: node.password || '',
        },
      }).then(res => res.json())
        .then(res => {
          switch (res.loadType.toUpperCase()) {
            case LoadType.TRACK_LOADED:
            case LoadType.SEARCH_RESULT:
              return resolve({
                tracks: [this.lavalinkToGuildTrack(res.tracks[0])],
                playlist: null
              })
            case LoadType.PLAYLIST_LOADED:
            // TODO: Add playlist support.
          }
        })
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
    const { track, info: { identifier, author, length, title, uri } } = llTrack

    return {
      track,
      id: identifier,
      author,
      duration: this.duration(length),
      title,
      link: uri,
      thumb: `https://img.youtube.com/vi/${identifier}/maxresdefault.jpg`,
    }
  }
}