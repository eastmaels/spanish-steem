// lib
import * as dotenv from 'dotenv'
import { Client, PrivateKey } from 'dsteem'
import * as es from 'event-stream'
import * as util from 'util'
import * as striptags from 'striptags'
import {
  send_memo,
  getPostData,
} from './steem'

const mongoose = require('mongoose')
require('./models/Overseer');
const Overseer = mongoose.model('Overseer');

// Environment Init
dotenv.config()
if (!process.env.BOT || !process.env.ACCOUNT_KEY) throw new Error('ENV variable missing')
// @ts-ignore
let ACCOUNT_KEY: string = process.env.ACCOUNT_KEY
// @ts-ignore
let BOT: string = process.env.BOT
// @ts-ignore
let SIMULATE_ONLY: boolean = (process.env.SIMULATE_ONLY === "true")

// Steem Init
const client = new Client('https://api.steemit.com')
let key = PrivateKey.from(ACCOUNT_KEY)
const stream = client.blockchain.getOperationsStream()

console.log('Operation started')
console.log('Is simulation?', SIMULATE_ONLY)

// Initialize mongoose then connect
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true })
mongoose.Promise = global.Promise
mongoose.connection
  .on('connected', () => {
    console.log('Mongoose connection open...');

    // Stream Steem Blockchain
    stream.on('data', async operation => {
      // Look for comment type of transaction
      if (operation.op[0] == 'comment') {
        let txData = operation.op[1]

        // Limit to posts only
        if (txData.parent_author !== '') return

        // get post data
        let postAuthor: string = txData.author
        let permlink: string = txData.permlink
        let post = await getPostData(postAuthor, permlink).catch(() =>
          console.error("Couldn't fetch post data with SteemJS")
        )

        // get tags
        let postTags: string[]
        try {
          postTags = JSON.parse(post.json_metadata).tags
        } catch (e) {
          console.error('Invalid root tags')
          return
        }

        // Check if contains spanish tags
        let containsSpTags = (postTags && (postTags.indexOf('spanish') >= 0 || postTags.indexOf('sp') >= 0))
        console.log('contains spanish OR sp tags: ', containsSpTags)
        if (!containsSpTags) return

        console.log('author: ', postAuthor)
        console.log('permlink: ', permlink)

        if (SIMULATE_ONLY) {
          console.log('simulation only...')
          console.log('sending memos to post author: ', postAuthor)
        } else {
          console.log('sending memo...')
          // Send Comment
          send_memo(client, key, postAuthor, BOT)
          .then(() => {
            console.error("Transfer done.")
          }).catch(() => {
            console.error("Couldn't transfer")
          })
        }
      }   // end: if (operation.op[0] == 'comment') {}
      return

    })  // end: stream.on()

  })  // end: mongo.connection on:connected
  .on('error', (err: any) => {
    console.log(`Connection error: ${err.message}`);
  })  // end: mongo.connection on:error

