import { GuildMember, TextChannel } from 'discord.js'

import { Category, Command, IRun } from '../Command'
import { Error } from '../util'

export const Skip = new (class extends Command {

  public name = 'skip'
  public category = Category.Music
  public description = 'Skips the current playing song.'
  public options = []
  public permissions = []

  public async run({ interaction, player }: IRun) {
    const guildMember = interaction.member as GuildMember

    if (!guildMember.voice.channel) return interaction.reply({ embeds: [Error('You must be in a voice channel to use this command')] })

    player.queueChannel = (interaction.channel as TextChannel)
    player.skipSong()
  }
})()