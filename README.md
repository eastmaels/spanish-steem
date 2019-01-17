# ULOGS BOT

Steem Bot To Enable And Grow Ulogs.org Communities & Ulog-subtags.

Current Version: v1.0.0

License: MIT

## Developer notes

Library used

* 'steem'
* 'dsteem'
* 'typescript'
* 'dotenv'
* 'nodemon'

## How to use it

Create a `.env` to store your posting key, username, and other configurations.

```
BOT=STEEM_NAME
MONGODB_URI=
POSTING_KEY=POSTING_KEY_HERE
SIMULATE_ONLY=false
TEST_ONLY=false
TEST_TAG=testing
```

Change variables in `config.ts`

Starting the server for development `npm run dev`
> I did not use babel or any minify work flow

For production, I would suggest using PM2 Library. (Install with `npm install -g pm2`)

Then, run `pm2 start dist/index.js`



## Credits

Imported from https://github.com/superoo7/cn-malaysia.
