const chapterSeed = require('./chapterSeed');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
// const baseURL = "http://kissmanga.com/Manga/One-Piece-Digital-Colored-Comics/";
const baseURL = "http://kissmanga.com/Manga/One-Piece/";
// const baseURL = "http://kissmanga.com/Manga/One-Piece-x-Toriko/";

(async () => {
  for (let chapterSection of chapterSeed) {
    await handleChapterSection(chapterSection);
  }
})();


async function handleChapterSection(chapterSection) {
  const browser = await puppeteer.launch();
  let promises = [];
  
  for (let chapter of chapterSection) {
    promises.push(openChapter(browser, chapter));
  }

  await Promise.all(promises);
  await browser.close();
}


// const cre = /Chapter-(\d\d\d).*/;
const cre = /(\d\d\d)[-\?]/;
// const cre = /-(\d\d\d)/;
async function openChapter(browser, chapter) {
  const chapterNum = cre.exec(chapter)[1];

  try {
    console.log(`${chapterNum} started`)
    const page = await browser.newPage();
    await page.goto(`${baseURL}${chapter}`);
    await page.waitFor(10000);
    const images = await page.evaluate(() => window.lstImages);
    await page.close();
    
    if (!fs.existsSync(`./${chapterNum}`)) { fs.mkdirSync(`./${chapterNum}`); }
    await downloadImages(images, chapterNum);
    console.log(`${chapterNum} finished downloading`)

  } catch (err) {
    // Properly accumulate which chapters we've failed on... later
    console.log(`Chapter ${chapterNum} failed to process`);
    return;
  }
}


function downloadImages(imageURLs, chapter) {
  for (let idx = 0; idx < imageURLs.length; idx++) {
    axios({
      url: imageURLs[idx],
      responseType: 'stream'
    }).then((res) => {
      res.data.pipe(fs.createWriteStream(`./${chapter}/${numPad(idx)}.png`))
    }).catch(() => {
      console.log(`Failed to download ${chapter}/${numPad(idx)}`);
    })
  }
}


function numPad(number) {
  return number < 10 ? `0${number}` : number;
}