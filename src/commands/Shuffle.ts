import { Category, Command, IRun } from '../Command'
import { RichEmbed } from '../util'

export const Shuffle = new (class extends Command {

  public name = 'shuffle'
  public category = Category.Music
  public description = 'Shuffle all the tracks in the queue'
  public options = []
  public permissions = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    guildPlayer.queue.shuffle()

    interaction.reply({ embeds: [RichEmbed('', 'Shuffled the queue.')] })
  }
})()