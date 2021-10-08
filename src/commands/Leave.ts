import { Category, Command, IRun } from '../Command'
import { RichEmbed } from '../util'

export const Leave = new (class extends Command {

  public name = 'leave'
  public category = Category.Music
  public description = 'Stops the current track, clears the queue and leaves the voice channel.'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (guildPlayer.queue.length) guildPlayer.queue.clear()

    guildPlayer.stop()
    guildPlayer.destroy()
    guildPlayer.disconnect()

    interaction.reply({ embeds: [RichEmbed('', 'Left the voice channel and cleared the queue.')] })
  }
})()