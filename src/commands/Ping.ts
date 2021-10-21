import { Category, Command, IRun } from '../Command'

export const Ping = new (class extends Command {

  public name = 'ping'
  public description = 'Ping the ws.'
  public options = []

  public async run({ soup, interaction }: IRun) {
    interaction.reply(soup.ws.ping.toString())
  }
})