import { TextChannel } from 'discord.js'
import { Track } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Play = new (class extends Command {

  public name = 'play'
  public category = Category.Fun
  public description = 'Play some music'
  public aliases = []

  public async run({ soup, message, args, player }: IRun) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel to use this command.')

    const { tracks, playlist } = await player.searchTrack(args.join(' '))

    await player.initPlayer(message.channel.id, message.member.voice.channel.id)

    player.queueChannel = (message.channel as TextChannel)

    for (const track of tracks) {
      if (!player.queue.length) {
        const trackNo = player.enqueue(track)
        player.play(trackNo)
      } else {
        player.enqueue(track)

        if(!playlist) message.channel.send({ embeds: [Track('Added to Queue', track)] })
      }
    }
  }
})()