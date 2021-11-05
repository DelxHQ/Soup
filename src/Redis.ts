import { Player } from 'erela.js'
import ioredis from 'ioredis'

export class Redis {
  
  public redis = new ioredis({
    port: parseInt(process.env.REDIS_PORT) || 6379,
    host: process.env.REDIS_HOST,
    family: 4,
    password: 'auth',
    db: 0,
  })

  private playersKey = 'players' // players
  private playerQueueKey = 'playersQueue' // queue for all players

  // public async init(): Promise<void> {
  //   await this.redis.connect()
  // }

  public async fetchPlayers(): Promise<string[]> {
    return await this.redis.smembers(this.playersKey)
  }

  public async addPlayer(player: Player): Promise<void> {
    await this.redis.sadd(this.playersKey, JSON.stringify({
      player: player.options,
    }))
  }
}
