import { GuildMember, TextChannel } from 'discord.js'
import { RichEmbed } from '../util/helpers'
import { Category, Command, IRun } from '../Command'

export const Stop = new (class extends Command {

  public name = 'stop'
  public category = Category.Music
  public description = 'Stops the current song and clears the queue.'
  public options = []
  public permissions = []

  public async run({ interaction, player }: IRun) {
    const guildMember = interaction.member as GuildMember

    if (!guildMember.voice.channel) return interaction.reply('You need to be in a voice channel to use this command.')

    player.queueChannel = (interaction.channel as TextChannel)
    player.clearQueue()
    interaction.reply({ embeds: [RichEmbed('Queue cleared.')] })
  }
})()