import { RichEmbed } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Stop = new (class extends Command {

  public name = 'stop'
  public category = Category.Music
  public description = 'Stops the current song and clears the queue.'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    guildPlayer.stop()
    guildPlayer.queue.clear()

    interaction.reply({ embeds: [RichEmbed('', 'Stopped the current song and cleared the queue.')] })
  }
})()