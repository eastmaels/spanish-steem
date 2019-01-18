import { Client, DatabaseAPI, DisqussionQuery, PrivateKey } from 'dsteem'
import * as dsteem from 'dsteem'
import * as steem from 'steem'

// This function will get the content of the post
export const getContent = async (author: string, permlink: string) => {
  let data = await steem.api.getContentAsync(author, permlink)
  return data.body
}

// This function will get the content of the post
export const getPostData = async (author: string, permlink: string) => {
  let data = await steem.api.getContentAsync(author, permlink)
  return data
}


export const getCertifiedUloggers = async (client: Client) => {
  let followlist = await client.call('follow_api', 'get_following', [
      'uloggers',
      '',
      'blog',
      1000,
  ])

  return followlist
}

export const vote = async (
  client: Client,
  voter: string,
  author: string,
  permlink: string,
  weight: number,
  key: PrivateKey,
) => {

  const vote_data = {
      voter,
      author,
      permlink,
      weight, //needs to be an integer for the vote function
  };

  await client.broadcast
    .vote(vote_data, key)
    .then(
      function(result) {
        console.log('Included in block: ' + result.block_num)
        console.log(`Voted on @${author}/${permlink}`)
      },
      function(error) {
        console.error(error)
        throw error
      }
    )
  return
}

const memo_template = `Quiero ayudar a todos los hispanohablantes a votar su comentario. Tengo más de 23,000 Steem Power, no era mucho, pero tal vez mis votos tengan algún significado para alguien.

 Lo que debe hacer es...
1. Mire el video tema del día publicado en www.steemit.com/@fatimajunio

2. Haga un comentario como un reflejo de lo que comprende

3. Si puede hacer un comentario de video sobre el tema es mejor para recibir votos más grandes. Puedes usar @dtube o youtube o @dsound.

Te invito a unirte también a nuestro chat Discord.
https://discord.gg/vzHFNd6
`;

export const send_memo = async (
  client: Client,
  key: PrivateKey,
  postAuthor: string,
  bot: string,
) => {
  console.log('sending memo to: ', postAuthor);
    
  let message = 'Hi @username! We support give upvotes for people who comment on Spanish related posts. Please come, see, and comment on the latest posts from...';
  message = message.replace( '@username', '@' + postAuthor );
  const transf = {
    from: bot,
    to: postAuthor,
    amount: '0.001 STEEM',
    memo: memo_template,
  }


  await client.broadcast
    .transfer(transf, key)
    .then(
      function(result) {
        console.log('Included in block: ' + result.block_num)
        console.log(`Transferred to @${postAuthor}`)
      },
      function(error) {
        console.error(error)
        throw error
      }
    )
  return
}


// This function will comment on the post
export const comment = async (
  client: Client,
  author: string,
  permlink: string,
  key: PrivateKey,
  postingAuthor: string,
  commentBody: string,
) => {
  const jsonMetadata = ''
  const comment_permlink = new Date()
    .toISOString()
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()

  const comment_data = {
      author: postingAuthor,
      title: '',
      body: commentBody,
      json_metadata: jsonMetadata,
      parent_author: author,
      parent_permlink: permlink,
      permlink: comment_permlink,
  };
  console.log('comment data', comment_data)

  await client.broadcast
    .comment(comment_data, key)
    .then(
      function(result) {
        console.log('Included in block: ' + result.block_num)
        console.log(`Commented on @${author}/${permlink}`)
      },
      function(error) {
        console.error(error)
        throw error
      }
    )
  return
}
