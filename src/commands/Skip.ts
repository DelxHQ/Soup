import { Category, Command, IRun } from '../Command'
import { Error, RichEmbed } from '../util'

export const Skip = new (class extends Command {

  public name = 'skip'
  public category = Category.Music
  public description = 'Skips the current playing song.'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    guildPlayer.stop()

    interaction.reply({ embeds: [RichEmbed('', 'Skipped the current track.')] })
  }
})()