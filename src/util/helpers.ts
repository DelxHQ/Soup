import { ColorResolvable, MessageEmbed, MessageEmbed as RE } from 'discord.js'
import { Track } from 'erela.js'

export type RichEmbedField = [string, (string | number), boolean?]

export function RichEmbed(
  title: string,
  desc?: string | null,
  fields: RichEmbedField[] = [],
  icon?: string | null,
  color: ColorResolvable = 'WHITE',
): MessageEmbed {
  let realTitle: string | null = title
  if (!desc) {
    desc = title
    realTitle = null
  }

  const embed = new RE()
    .setDescription(desc)
    .setColor(color)

  if (realTitle) embed.setTitle(realTitle)
  if (icon) embed.setThumbnail(icon)

  for (const [fTitle, fDesc, fInline] of fields) {
    embed.addField(fTitle, fDesc as string, typeof fInline === 'undefined' ? true : fInline)
  }

  return embed
}

export function Error(msg: string): MessageEmbed {
  return RichEmbed('Error', msg)
}

export function Image(src: string, title?: string, desc?: string): MessageEmbed {
  const e = new RE()
    .setImage(src)
    .setColor('#f2df88')

  if (title) e.setTitle(title)
  if (desc) e.setDescription(desc)

  return e
}

export function Track(embedTitle: string, track: Track): MessageEmbed {
  const re = new RE()
    .setAuthor(embedTitle)
    .setTitle(track.title)
    .setDescription(track.author)
    .setURL(track.uri)
    .setFooter(duration(track.duration))
    .setColor('#f2df88')

  if (track.thumbnail) re.setThumbnail(track.thumbnail)

  return re
}

export function duration(ms: number): string {
  const hours = ms / (1000 * 60 * 60)
  const absoluteHours = Math.floor(hours)
  const h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours

  const minutes = (hours - absoluteHours) * 60
  const absoluteMinutes = Math.floor(minutes)
  const m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes

  const seconds = (minutes - absoluteMinutes) * 60
  const absoluteSeconds = Math.floor(seconds)
  const s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds

  return h + ':' + m + ':' + s
}