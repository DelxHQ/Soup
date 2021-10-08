import { MessageEmbed, TextChannel } from 'discord.js'
import { Player, Track } from 'erela.js'
import { Soup } from '../Soup'
import { Track as GuildTrack } from '../util'


export class PlayerEventHandler {

  constructor(private soup: Soup) {}

  public async init(): Promise<void> {
    await Promise.all([
      this.initListeners(),
    ])
  }

  private async initListeners() {
    this.soup.manager.on('trackStart', (player: Player, track: Track) => {
      const textChannel = this.soup.channels.cache.get(player.textChannel) as TextChannel

      textChannel.send({ embeds: [GuildTrack('Now Playing', track)] })
    })
  }
}