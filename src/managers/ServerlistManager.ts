import Logger from '@bwatton/logger'
import fetch from 'node-fetch'
import { Soup } from '../Soup'

export interface IList {
  'top.gg': IListOpts
}

export interface IListOpts {
  uri: string
  auth: string
}

export class ServerlistManager {

  private logger: Logger = new Logger('ServerListManager')

  private lists: IList[] =[{
    'top.gg': {
      uri: `https://top.gg/api/bots/${this.soup.user.id}/stats`,
      auth: process.env.TOP_GG_TOKEN,
    },
  }]

  constructor(private soup: Soup) { }

  public async sendServerCount(): Promise<void> {
    for (const list of this.lists) {
      await fetch(list['top.gg'].uri, {
        method: 'post',
        body: JSON.stringify({ server_count: this.soup.guilds.cache.size }),
        headers: { 
          'Authorization': list['top.gg'].auth,
          'Content-Type': 'application/json', 
        },
      })
    }
  }
}