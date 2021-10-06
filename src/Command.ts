import { Soup } from './Soup'
import { PlayerManager } from './managers/PlayerManager'
import { Permission } from './util/Permissions'
import { ApplicationCommandOptionData, BaseCommandInteraction, CommandInteractionOptionResolver } from 'discord.js'

export enum Category {
  Fun,
  Music,
  Utilities,
  Moderation,
  ImageManipulation,
}

export interface IRun {
  soup: Soup,
  interaction: BaseCommandInteraction,
  options: CommandInteractionOptionResolver,
  player: PlayerManager,
}

export abstract class Command {

  public abstract name: string
  public abstract category: Category
  public abstract description: string
  public abstract options: ApplicationCommandOptionData[]
  public permissions: Permission[] = []

  public abstract run(args: IRun): Promise<any>

}