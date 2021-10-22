import { Constants, GuildMember, MessageEmbed } from 'discord.js'
import { Command, IRun } from '../Command'
import { SearchResult } from 'erela.js'
import { RichEmbed } from '../util'

export const Play = new (class extends Command {

  public name = 'play'
  public description = 'Plays a specified song and adds it to the queue.'
  public options = [{
    name: 'query',
    description: 'A YouTube/Spotify query or link.',
    required: true,
    type: Constants.ApplicationCommandOptionTypes.STRING,
  }]
  public voiceOnly = true

  public async run({ soup, interaction, options }: IRun) {
    const guildMember = interaction.member as GuildMember

    const player = soup.manager.create({
      guild: interaction.guild.id,
      voiceChannel: guildMember.voice.channel.id,
      textChannel: interaction.channel.id,
      selfDeafen: true,
    })

    let res: SearchResult

    try {
      res = await player.search(options.getString('query'), interaction.member)
      if (res.loadType === 'LOAD_FAILED') {
        if (!player.queue.current) player.destroy()
        throw res.exception
      }
    } catch (err) {
      //
    }
    if (res.loadType == 'NO_MATCHES') {
      if (!player.queue.current) player.destroy()

    } else if (res.loadType == 'PLAYLIST_LOADED') {
      if (player.state !== 'CONNECTED') player.connect()
      player.queue.add(res.tracks)
      interaction.reply({  embeds: [RichEmbed('Queued playlist', `\`${res.playlist.name}\`. \`${res.tracks.length}\` tracks.`)] })
  
      if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play()
    } else {
      if (player.state !== 'CONNECTED') player.connect()
      player.queue.add(res.tracks[0])
      interaction.reply({ embeds: [RichEmbed('Added to queue', `\`${res.tracks[0].title}\`.`)] })
      if (!player.playing && !player.paused && !player.queue.size) {
        player.play()
      } else {
        //
      }
    }
  }
})()