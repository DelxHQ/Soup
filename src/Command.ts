import { Soup } from './Soup'
import { PlayerManager } from './managers/PlayerManager'
import { Permission } from './util/Permissions'
import { Message } from 'discord.js'

export enum Category {
  Fun,
  Music,
  Utilities,
  Moderation,
  ImageManipulation,
}

export interface IRun {
  soup: Soup,
  message: Message,
  args: string[],
  player: PlayerManager,
}

export abstract class Command {

  public abstract name: string
  public abstract category: Category
  public abstract description: string
  public aliases: string[] = []
  public permissions: Permission[] = []

  public abstract run(args: IRun): Promise<any>

}