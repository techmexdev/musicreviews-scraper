const puppeteer = require('puppeteer');
const Pool = require('pg').Pool;
const uuidv4 = require('uuid/v4');

const pool = new Pool({
  connectionString: process.env.PG_DSN
});

(async () => {

  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.goto('https://www.youtube.com/user/theneedledrop/videos')
  await page.screenshot({path: 'example.png'})

  const reviewSet = new Set()
  
  while(true) {
    await page.evaluate('window.scrollTo(0, 1000000)')
    await wait()
    const reviews = await page.$$eval('#dismissable', 
      els => els.map(el => ({
        link: el.querySelector('img').src,
        thumbnailLink: el.querySelector('#video-title').href,
        title: el.querySelector('#video-title').title
      })
     ).filter(r => r.link && r.thumbnailLink && r.title))

    reviews.forEach(r => { reviewSet.add(r) })

    reviewSet.forEach(r => { insertReview(r) })
    reviewSet.clear() 
    console.log('------------------')
  }
})();

async function wait() {
  return new Promise(res => {
    setTimeout(res, 1000)
  })
}

async function insertReview({ link, thumbnailLink, title }) {
 console.log(`inserting ${title}`)

 return pool.query(`INSERT INTO video_reviews(id, link, thumbnail_link, title)
   VALUES($1, $2, $3, $4)`,
   [uuidv4(), link, thumbnailLink, title])
  .then(res => {
    console.log(res.rows[0])
  })
  .catch(e => console.error(e.stack))
}
