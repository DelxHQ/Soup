import { BaseCommandInteraction, Message, MessageReaction, User } from 'discord.js'
import { Player } from 'erela.js'

import { Command, IRun } from '../Command'
import { duration, Error, RichEmbed } from '../util/helpers'
import { progressbar } from '../util/progressBar'

const PAGE_SIZE = 10

export const Queue = new (class extends Command {

  public name = 'queue'
  public description = 'Display a list of songs in the queue.'
  public options = []
  public voiceOnly = true

  public async run({ soup, interaction }: IRun) {
    const guildPlayer = soup.manager.players.get(interaction.guild.id)

    if (!guildPlayer) return interaction.reply({ embeds: [Error('A player doesn\'t exist for this guild.')] })
    if (!guildPlayer.queue) return interaction.reply({ embeds: [Error('No tracks in queue')] })

    const currentTrack = guildPlayer.queue.current

    interaction.reply({
      embeds: [
        RichEmbed(currentTrack.title, currentTrack.author, [
          ['\u200b', progressbar(currentTrack.duration, guildPlayer.position, 20, '▬', '🔘')],
        ], currentTrack.thumbnail, '#f2df88')
          .setAuthor('Current Song')
          .setFooter(duration(currentTrack.duration))
          .setURL(currentTrack.uri),
      ],
    })
    this.sendQueue(interaction, guildPlayer)
  }

  private async sendQueue(interaction: BaseCommandInteraction, player: Player, page = 1, message?: Message) {
    const pages = player.queue.length <= PAGE_SIZE ? 1 : Math.ceil(player.queue.length / PAGE_SIZE)

    const embed = RichEmbed(
      'Song Queue', '',
      player.queue.slice(page === 1 ? 0 : (page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((t, i) => [
        `${((page - 1) * PAGE_SIZE) + i + 1}. ${t.title}`, `${t.author}`, false,
      ]),
    ).setFooter(`Page ${page}/${pages}`)

    if (!message) message = (await interaction.channel.send({ embeds: [embed] }) as Message)
    else {
      message.reactions.cache.clear()
      message = await message.edit({ embeds: [embed] })
    }

    if (page - 1 > 0) await message.react('⬆')
    if (page + 1 <= pages) message.react('⬇')

    const filter = (reaction: MessageReaction, user: User) => {
      return ['⬆', '⬇'].includes(reaction.emoji.name) && user.id === interaction.member.user.id
    }

    message.awaitReactions({ filter, max: 1, time: 60000 }).then(async collected => {
      const reaction = collected.first()
      if (!reaction) return

      if (reaction.emoji.name === '⬆') {
        this.sendQueue(interaction, player, page - 1, message)
      } else if (reaction.emoji.name === '⬇') {
        this.sendQueue(interaction, player, page + 1, message)
      }
    })

    return embed
  }
})()
