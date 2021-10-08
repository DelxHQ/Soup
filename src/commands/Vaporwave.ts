import { RichEmbed } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Vaporwave = new (class extends Command {

  public name = 'Vaporwave'
  public category = Category.Music
  public description = 'Stops the current song and clears the queue.'
  public options = []
  public permissions = []

  public async run({ soup, interaction }: IRun) {
    // const guildPlayer = soup.manager.players.get(interaction.guild.id)
  
  }
})()