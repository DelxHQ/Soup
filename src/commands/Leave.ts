import { Command, IRun } from '../Command'
import { RichEmbed, Error } from '../util'

export const Leave = new (class extends Command {

  public name = 'leave'
  public description = 'Stops the current track, clears the queue and leaves the voice channel.'
  public options = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    if (guildPlayer.queue.length) guildPlayer.queue.clear()

    guildPlayer.stop()
    guildPlayer.destroy()
    guildPlayer.disconnect()

    interaction.reply({ embeds: [RichEmbed('', 'Left the voice channel and cleared the queue.')] })
  }
})()
