import { TextChannel } from 'discord.js'

import { Category, Command, IRun } from '../Command'
import { Error } from '../util'

export const Skip = new (class extends Command {

  public name = 'skip'
  public category = Category.Music
  public description = 'Skip current song'
  public aliases = ['s', 'next']
  public permissions = []

  public async run({ message, player }: IRun) {
    if (!message.member.voice.channel) return message.channel.send({ embeds: [Error('You must be in a voice channel to use this command')] })

    player.queueChannel = (message.channel as TextChannel)
    player.skipSong()
  }

})()