import { Soup } from './Soup'

const LOGIN_TOKEN: string = ''

;(async() => {
  await new Soup(LOGIN_TOKEN).init()
})()