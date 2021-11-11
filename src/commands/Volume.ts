import { RichEmbed, Error } from '../util/helpers'
import { Command, IRun } from '../Command'
import { Constants } from 'discord.js'

export const Volume = new (class extends Command {

  public name = 'volume'
  public description = 'Changes the player volume.'
  public options = [{
    name: 'volume',
    description: 'Volume (%)',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.NUMBER
  }]
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })
    if (options.getNumber('volume') > 500) return interaction.reply({ embeds: [Error('Maximum volume can only be 500%')] })

    guildPlayer.setVolume(options.getNumber('volume'))

    interaction.reply({ embeds: [RichEmbed('', `Set volume to ${guildPlayer.volume}`)] })
  }
})()
