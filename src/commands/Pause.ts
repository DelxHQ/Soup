import { Category, Command, IRun } from '../Command'
import { RichEmbed, Error } from '../util'

export const Pause = new (class extends Command {

  public name = 'pause'
  public category = Category.Music
  public description = 'Pause the current playing track.'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    if (guildPlayer.playing) {
      guildPlayer.pause(true)
      interaction.reply({ embeds: [RichEmbed('', 'Paused the current track.')] })
    } else {
      guildPlayer.pause(false)
      interaction.reply({ embeds: [RichEmbed('', 'Unpaused the current track.')] })
    }
  }
})()