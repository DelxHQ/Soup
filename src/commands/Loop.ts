import { ApplicationCommandOptionData, Constants } from 'discord.js'
import { Command, IRun } from '../Command'
import { Error, RichEmbed } from '../util'

export const Loop = new (class extends Command {

  public name = 'loop'
  public description = 'Loop the current track or queue.'
  public options: ApplicationCommandOptionData[] = [{
    name: 'type',
    description: 'Type of loop.',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING,
    choices: [
      { name: 'Queue', value: 'queue' },
      { name: 'Track', value: 'track' },
      { name: 'Disabled', value: 'disabled' },
    ],
  }]

  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    if (options.get('type').value === 'track') {
      guildPlayer.setTrackRepeat(true)
      interaction.reply({ embeds: [RichEmbed('', 'Enabled loop for the current track.')] })
    } else if (options.get('type').value === 'queue') {
      guildPlayer.setQueueRepeat(true)
      interaction.reply({ embeds: [RichEmbed('', 'Enabled loop for the queue.')] })
    } else if (options.get('type').value === 'disabled') {
      if (guildPlayer.trackRepeat || guildPlayer.queueRepeat) {
        guildPlayer.setQueueRepeat(false)
        guildPlayer.setTrackRepeat(false)
        interaction.reply({ embeds: [RichEmbed('', 'Disabled queue/track loop.')] })
      }
    }
  }
})()
