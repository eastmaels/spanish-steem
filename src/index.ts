// lib
import * as dotenv from 'dotenv'
import { Client, PrivateKey } from 'dsteem'
import * as es from 'event-stream'
import * as util from 'util'
import * as striptags from 'striptags'

const mongoose = require('mongoose')
require('./models/Overseer');
const Overseer = mongoose.model('Overseer');


// Environment Init
dotenv.config()
if (!process.env.BOT || !process.env.ACCOUNT_KEY || !process.env.BOT_COMMAND
    || !process.env.MAIN_TAG || !process.env.ULOGS_APP 
    || !process.env.DEFAULT_VOTE_WEIGHT) throw new Error('ENV variable missing')
// @ts-ignore
let ACCOUNT_KEY: string = process.env.ACCOUNT_KEY

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

        // check if reply (return if post)
        if (txData.parent_author === '') return

        // get post data
        let summoner: string = txData.author
        let permlink: string = txData.permlink
        let post = await getPostData(summoner, permlink).catch(() =>
          console.error("Couldn't fetch post data with SteemJS")
        )

        // get root post (to get all tags)
        let rootPost = await getPostData(post.root_author, post.root_permlink)
          .catch(() =>
            console.error("Couldn't fetch ROOT post data with SteemJS")
          )

        // 4) First tag is 'ulogs'
        let rootTags: string[]
        try {
          rootTags = JSON.parse(rootPost.json_metadata).tags
        } catch (e) {
          console.error('Invalid root tags')
          return
        }

        if (SIMULATE_ONLY) {
          console.log('simulation only...')
          console.log(commentTemplate)
        } else {
          console.log('sending comment...')
          // Send Comment
          comment(client, summoner, permlink, key, BOT, commentTemplate)
          .then(() => {

            if(isSuccess) {
              let voteweight = getVoteWeight(parseInt(splitBody[1]), overseerInfo.maxweight)
              console.log('voting with weight...', voteweight)
              // Vote post
              vote(client, BOT, post.root_author, post.root_permlink,
                  voteweight, key).catch(() =>
                console.error("Couldn't vote on the violated post")
              )
            }
          }).catch(() => {
            console.error("Couldn't comment on the violated post")
          })
        }
      }   // end: if (operation.op[0] == 'comment') {}
      return

    })  // end: stream.on()

  })  // end: mongo.connection on:connected
  .on('error', (err: any) => {
    console.log(`Connection error: ${err.message}`);
  })  // end: mongo.connection on:error

