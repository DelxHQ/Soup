import { ApplicationCommandOptionData, Constants } from 'discord.js'
import { Command, IRun } from '../Command'
import { Error, RichEmbed } from '../util'

export const Remove = new (class extends Command {

  public name = 'remove'
  public description = 'Remove a track from the queue.'
  public options: ApplicationCommandOptionData[] = [{
    name: 'trackno',
    description: 'Number of the track in the queue.',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.NUMBER,
  }]
  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    const trackNo = options.getNumber('trackno')
    const trackTitle = guildPlayer.queue[trackNo - 1].title

    guildPlayer.queue.remove(trackNo)

    interaction.reply({ embeds: [RichEmbed('', `Removed ${trackTitle} from the queue.`)] })
  }
})()
