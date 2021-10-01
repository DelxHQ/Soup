import { Category, Command, IRun } from '../Command'

export const Ping = new (class extends Command {

  public name = 'ping'
  public category = Category.Fun
  public description = 'Ping'
  public aliases = []

  public async run({ soup, message, args }: IRun) {
    message.channel.send(soup.ws.ping.toString())
  }
})