import { Soup } from './Soup'
import { ApplicationCommandOptionData, BaseCommandInteraction, CommandInteractionOptionResolver, PermissionFlags } from 'discord.js'

export interface IRun {
  soup: Soup,
  interaction: BaseCommandInteraction,
  options: CommandInteractionOptionResolver,
}

export abstract class Command {

  public abstract name: string
  public abstract description: string
  public abstract options: ApplicationCommandOptionData[]
  public voiceOnly: boolean

  public abstract run(args: IRun): Promise<any>

}
