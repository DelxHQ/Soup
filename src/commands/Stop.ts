import { TextChannel } from 'discord.js'
import { RichEmbed } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Stop = new (class extends Command {

  public name = 'stop'
  public category = Category.Music
  public description = 'Stops and clears the queue'
  public aliases = ['s', 'clear']
  public permissions = []

  public async run({ message, player }: IRun) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel to use this command.')

    player.queueChannel = (message.channel as TextChannel)
    player.clearQueue()
    message.channel.send({ embeds: [RichEmbed('Queue cleared, leaving channel')] })
  }
})()