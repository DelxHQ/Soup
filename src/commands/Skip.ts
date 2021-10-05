import { Message, TextChannel } from 'discord.js'

import { Category, Command, IRun } from '../Command'
import { Soup } from '../Soup'
import { PlayerManager } from '../managers/PlayerManager'
import { Error, RichEmbed, Track } from '../util/helpers'

export const Skip = new (class extends Command {

  public name = 'skip'
  public category = Category.Music
  public description = 'Skip current song'
  public aliases = ['s', 'next']
  public permissions = []

  public async run({ soup, message, args, player }: IRun) {
    // if (!msg.member.voiceChannel) return msg.channel.send(Error('You must be in a voice channel to use this command'))

    player.queueChannel = (message.channel as TextChannel)
    player.skipSong()
  }

})()