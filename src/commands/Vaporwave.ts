import { RichEmbed } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Vaporwave = new (class extends Command {

  public name = 'vaporwave'
  public category = Category.Music
  public description = 'Applies a vaporwave effect to the current track'
  public options = []
  public permissions = []

  public async run({ soup, interaction }: IRun) {
    // const guildPlayer = soup.manager.players.get(interaction.guild.id)
  
  }
})()