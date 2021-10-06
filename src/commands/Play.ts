import { Constants, GuildMember, TextChannel } from 'discord.js'
import { Track } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Play = new (class extends Command {

  public name = 'play'
  public category = Category.Music
  public description = 'Plays a specified song and adds it to the queue.'
  public options = [{
    name: 'query',
    description: 'A YouTube/Spotify query or link.',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING
  }]

  public async run({ interaction, options, player }: IRun) {
    const guildMember = interaction.member as GuildMember

    if (!guildMember.voice.channel) return interaction.reply('You need to be in a voice channel to use this command.')

    await player.initPlayer(interaction.channel.id, guildMember.voice.channel.id)

    const { tracks, playlist } = await player.searchTrack(options.getString('query'))

    player.queueChannel = (interaction.channel as TextChannel)

    for (const track of tracks) {
      if (!player.queue.length) {
        const trackNo = player.enqueue(track)
        player.play(trackNo)
      } else {
        player.enqueue(track)

        if(!playlist) interaction.reply({ embeds: [Track('Added to Queue', track)] })
      }
    }
  }
})()