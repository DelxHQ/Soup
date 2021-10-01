import { Category, Command, IRun } from '../Command'

export const Play = new (class extends Command {

  public name = 'play'
  public category = Category.Fun
  public description = 'Play some music'
  public aliases = []

  public async run({ soup, message, args }: IRun) {
    if (!message.member.voice) return message.reply("you need to join a voice channel.")

    const search = args.join(" ");

    const res = await soup.manager.search(search, message.author)

    const player = soup.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
      selfDeafen: true
    })

    player.connect()
    
    message.reply(`enqueuing ${res.tracks[0].title}.`)

    player.queue.add(res.tracks[0])

    if (!player.playing) {
      player.play()
    }
  }
})