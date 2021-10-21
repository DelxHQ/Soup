import { Message, TextChannel } from 'discord.js'
import { Player, Track, TrackExceptionEvent, UnresolvedTrack } from 'erela.js'
import { Soup } from '../Soup'
import { Error, RichEmbed, Track as GuildTrack } from '../util'

export class PlayerHandler {

  constructor(private soup: Soup) { }

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
    this.soup.manager.on('playerMove', (player, initChannel, newChannel) => this.onPlayerMove(player, initChannel, newChannel))
    this.soup.manager.on('playerDestroy', (player) => this.onPlayerDestroy(player))
  }

  private async onTrackStart(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    const nowPlayingMessage = await textChannel.send({ embeds: [GuildTrack('Now Playing', track)] })

    this.nowPlayingMessages.set(textChannel.id, nowPlayingMessage)
  }

  private async onTrackEnd(player: Player, track: Track) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    const originalPlayingMessage = this.nowPlayingMessages.get(textChannel.id)

    if (this.nowPlayingMessages.has(textChannel.id)) originalPlayingMessage.delete()
  }

  private async onTrackError(player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel
    const guild = this.soup.guilds.cache.get(player.guild)

    textChannel.send({ embeds: [Error(`An error occured whilst trying to play \`${track.title}\` Skipping to next track.`)] })

    this.soup.soupChannels.logs.send({
      embeds: [
        RichEmbed('A Lavalink error has occured whilst trying to play a track.', '', [
          ['Track', `\`\`\`${track.title} (${track.uri})\`\`\``],
          ['Error', `\`\`\`${payload.exception.message || payload.error}\`\`\``],
        ]).setFooter(`GUILD ID: ${guild.id}`),
      ],
    })
  }

  private async onPlayerMove(player: Player, initChannel: string, newChannel: string) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    if (!newChannel) { // Assume we've been disconnected from the voice channel
      if (this.nowPlayingMessages.has(textChannel.id)) this.nowPlayingMessages.delete(textChannel.id)

      return player.destroy()
    }

    player.setVoiceChannel(newChannel)
  }

  private async onPlayerDestroy(player: Player) {
    const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

    if (this.nowPlayingMessages.has(textChannel.id)) this.nowPlayingMessages.delete(textChannel.id)
  }
}