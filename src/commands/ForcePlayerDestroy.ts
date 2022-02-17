import { ApplicationCommandOptionData, Constants } from 'discord.js'
import { Command, IRun } from '../Command'
import { RichEmbed, Error } from '../util'

export const ForcePlayerDestroy = new (class extends Command {

  public name = 'destroyplayer'
  public description = 'Force destroy a player'
  public options: ApplicationCommandOptionData[] = [{
    name: 'guildid',
    description: 'Guild ID of the player to destroy',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING,
  }]
  public permissions = []

  public async run({ soup, interaction, options }: IRun) {
    const guildPlayer = soup.manager.players.get(options.getString('guildid'))

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    guildPlayer.destroy()

    interaction.reply({ embeds: [RichEmbed('', 'Forced destroyed player for guild')] })
  }
})()
