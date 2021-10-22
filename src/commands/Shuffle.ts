import { Command, IRun } from '../Command'
import { RichEmbed, Error } from '../util'

export const Shuffle = new (class extends Command {

  public name = 'shuffle'
  public description = 'Shuffle all the tracks in the queue'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })

    guildPlayer.queue.shuffle()

    interaction.reply({ embeds: [RichEmbed('', 'Shuffled the queue.')] })
  }
})()