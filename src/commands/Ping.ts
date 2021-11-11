import { Command, IRun } from '../Command'
import { codeBlock, RichEmbed } from '../util'

export const Ping = new (class extends Command {

  public name = 'ping'
  public description = 'Ping the ws.'
  public options = []

  public async run({ soup, interaction }: IRun) {
    const m = await interaction.channel.send({ embeds: [RichEmbed('', codeBlock(`Gateway: ${soup.ws.ping}ms`))] })

    interaction.reply({
      embeds: [
        RichEmbed(
          '', codeBlock(`Gateway: ${soup.ws.ping}ms\nRest: ${Math.round(m.createdTimestamp - interaction.createdTimestamp)}ms`),
          [], null, 'RED'
        )]
    })
    m.delete()
  }
})
