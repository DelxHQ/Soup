import { ApplicationCommandOptionData, Constants } from 'discord.js'
import { Command, IRun } from '../Command'
import { RichEmbed, Error } from '../util'

export const ForcePlayerDestroy = new (class extends Command {

  public name = 'destroyPlayer'
  public description = 'Force destroy a player'
  public options: ApplicationCommandOptionData[] = [{
    name: 'guildId',
    description: 'Guild ID of the player to destroy',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING,
  }]
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(options.getString('guildId'))

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    guildPlayer.destroy()

    interaction.reply({ embeds: [RichEmbed('', 'Forced destroyed player for guild')] })
  }
})()
