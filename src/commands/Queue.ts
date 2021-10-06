import { BaseCommandInteraction, Message, MessageReaction, User } from 'discord.js'

import { Category, Command, IRun } from '../Command'
import { PlayerManager } from '../managers/PlayerManager'
import { Error, RichEmbed, Track } from '../util/helpers'

const PAGE_SIZE = 10

export const Queue = new (class extends Command {

  public name = 'queue'
  public category = Category.Music
  public description = 'Display a list of songs in the queue.'
  public options = []
  public permissions = []

  public async run({ interaction, player }: IRun) {
    if (!player.queue.length) return interaction.reply({ embeds: [Error('No tracks in queue')] })

    if (player.player && player.player.playing && player.currentTrack) {
      interaction.reply({ embeds: [Track('Current Song', player.currentTrack)] })
    }

    this.sendQueue(interaction, player)
  }

  private async sendQueue(interaction: BaseCommandInteraction, player: PlayerManager, page: number = 1, interact?: BaseCommandInteraction) {
    const pages = player.queue.length <= PAGE_SIZE ? 1 : Math.ceil(player.queue.length / PAGE_SIZE)

    const embed = RichEmbed(
      'Song Queue', '',
      player.queue.slice(page === 1 ? 0 : (page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((t, i) => [
        `${((page - 1) * PAGE_SIZE) + i + 1}. ${t.title}`, `${t.author}`, false,
      ]),
    ).setFooter(`Page ${page}/${pages}`)

    if (!message) message = (await msg.channel.send({ embeds: [embed] }) as Message)
    else {
      message.reactions.cache.clear()
      message = await message.edit({ embeds: [embed] })
    }

    if (page - 1 > 0) await message.react('⬆')
    if (page + 1 <= pages) message.react('⬇')

    const filter = (reaction: MessageReaction, user: User) => {
      return ['⬆', '⬇'].includes(reaction.emoji.name) && user.id === msg.author.id
    }

    message.awaitReactions({ filter, max: 1, time: 60000 }).then(async collected => {
      const reaction = collected.first()
      if (!reaction) return

      if (reaction.emoji.name === '⬆') {
        this.sendQueue(msg, player, page - 1, message)
      } else if (reaction.emoji.name === '⬇') {
        this.sendQueue(msg, player, page + 1, message)
      }
    })

    return embed
  }
})()