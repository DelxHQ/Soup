import { Soup } from './Soup'
import { Permission } from './util/Permissions'
import { ApplicationCommandOptionData, BaseCommandInteraction, CommandInteractionOptionResolver } from 'discord.js'

export interface IRun {
  soup: Soup,
  interaction: BaseCommandInteraction,
  options: CommandInteractionOptionResolver,
}

export abstract class Command {

  public abstract name: string
  public abstract description: string
  public abstract options: ApplicationCommandOptionData[]
  public permissions: Permission[] = []
  public voiceOnly: boolean

  public abstract run(args: IRun): Promise<any>

}
