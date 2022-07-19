import { ApplicationCommandOptionData, Constants } from 'discord.js'
import { Command, IRun } from '../Command'
import { Error, RichEmbed } from '../util'

export const Skip = new (class extends Command {

  public name = 'skip'
  public description = 'Skips the current playing song.'
  public options: ApplicationCommandOptionData[] = [{
    name: 'tracks',
    description: 'Number of tracks to skip.',
    required: false,
    type: Constants.ApplicationCommandOptionTypes.NUMBER,
  }]
  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    const noOfTracks = options.getNumber('tracks')

    guildPlayer.stop(noOfTracks > 1 ? noOfTracks : null)

    interaction.reply({ embeds: [RichEmbed('', 'Skipped the current track.')] })
  }
})()
