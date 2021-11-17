import { RichEmbed, Error } from '../util/helpers'
import { Command, IRun } from '../Command'

export const Stop = new (class extends Command {

  public name = 'stop'
  public description = 'Stops the current song and clears the queue.'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    guildPlayer.stop()
    guildPlayer.queue.clear()

    interaction.reply({ embeds: [RichEmbed('', 'Stopped the current song and cleared the queue.')] })
  }
})()
