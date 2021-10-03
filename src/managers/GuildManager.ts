import { Guild } from 'discord.js'
import { Player } from 'erela.js'
import { Soup } from '../Soup'
import { VoiceState } from '../types/VoiceState'


export class GuildManager {

  public player: Player

  constructor(public guild: Guild, private soup: Soup) {

  }

  public createPlayer(voiceChannelId: string, textChannelId: string) {
    this.player = this.soup.manager.create({
      guild: this.guild.id,
      voiceChannel: voiceChannelId,
      textChannel: textChannelId,
      selfDeafen: true
    })
    if (this.player.state != VoiceState.CONNECTED) this.player.connect()

    return this.player
  }
}