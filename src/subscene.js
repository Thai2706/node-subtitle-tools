const got = require('got-scraping').gotScraping;
const cheerio = require('cheerio');
var AdmZip = require("adm-zip");
const langs = require('./langs.json');

const ssBaseURL = 'https://subscene.com/';
const tmdbBaseURL = 'https://api.themoviedb.org/3/';

/**
 * Search for title on [subscene.com](https://subscene.com)
 * @param {string} title Film title
 * @returns An array of founded titles
 */
async function searchByTitle(title) {

  const response = await got({
    url: `${ssBaseURL}subtitles/searchbytitle`,
    method: 'POST',
    json: {
      query: title
    }
  });

  let answer = [];

  if (response.statusCode === 200) {
    const $ = cheerio.load(response.body);

    $('div.title a').map((i, e) => {
      answer.push({
        title: $(e).text(),
        path: $(e).attr('href')
      });
    });
  }

  answer = answer.filter((obj, index, self) => {
    return index === self.findIndex((o) => {
      return JSON.stringify(o) === JSON.stringify(obj);
    });
  });

  return answer;
}

/**
 * 
 * @param {string} id `IMDb ID`
 * @param {string} apiKey Your `TMDB API KEY`
 * @returns Information about title including title, imdb, path and subtitles
 */
async function getSubtitleByImdbId(id, apiKey, options) {
  const response = await got({
    url: `${tmdbBaseURL}find/${id}?external_source=imdb_id&api_key=${apiKey}`,
    method: 'GET',
    responseType: 'json',
  });

  const result = response.body.movie_results[0] || response.body.tv_results[0];

  const title = result.original_title || result.original_name;
  const year = parseInt(result.release_date?.slice(0, 4) || result.first_air_date?.slice(0, 4));
  const type = result.media_type;

  const searchTitleResults = await searchByTitle(title);

  for (let i = 0; i < searchTitleResults.length; i++) {
    const yearInString = searchTitleResults[i].title.match(/\((\d+)\)/);
    const titleYear = parseInt(yearInString != null ? yearInString[1] : 0);

    if (type === 'tv' || titleYear === year) {
      const titleDetails = await getTitleDetails(searchTitleResults[i].path, true, options);
      if (titleDetails.imdb === id) {
        return titleDetails.subtitles;
      }
    } else {
      continue;
    }
  }
}

/**
 * 
 * @param {string} path Path which return by `searchByTitle` function
 * @param {boolean} withSubs Return with subtitles or not, default: `false`
 * @param {{language: [], rate: 'positive' | 'neutral' | 'bad'}} options Array of language code (`en`, `fr`,...) and rate options  
 * @returns Information about title including title, imdb, path and subtitles
 */
async function getTitleDetails(path, withSubs = false, options) {
  const response = await got({
    url: `${ssBaseURL}${path}`,
    method: 'GET'
  });

  const answer = {};

  if (response.statusCode === 200) {
    const $ = cheerio.load(response.body);

    const title = $('div.header h2:first').contents().first().text().trim();
    const imdb = $('a.imdb:first').attr('href').split('/').pop();

    answer.title = title;
    answer.imdb = imdb;
    answer.path = path;

    if (withSubs) {
      answer.subtitles = getSubtitlesList(response.body, options);
    }
  }

  return answer;
}

/**
 * 
 * @param {string} body Body of the response
 * @param {{language: [], rate: 'positive' | 'neutral' | 'bad'}} options Array of language code (`en`, `fr`,...), note: `Big 5 code` is `b5`, `Brazillian Portuguese` is `bp` and `English/ German` is `eg` and rate options
 */
function getSubtitlesList(body, options) {
  const $ = cheerio.load(body);

  let answer = {};

  if (!options) {
    const subtitleElements = $('td.a1 a');
    subtitleElements.each((i, e) => {
      const languageCode = langs.subsceneLangs[$(e).find('span:first-child').text().trim()]
      const languageName = langs.isoLangs[languageCode].name;
      const rateClass = $(e).find('span:first-child').attr('class');
      const rate = rateClass.includes('positive') ? 'positive' : rateClass.includes('neutral') ? 'neutral' : 'bad'

      if (answer[languageName.toLowerCase()]) {
        answer[languageName.toLowerCase()].push({
          name: $(e).find('span:last-child').text().trim(),
          path: $(e).attr('href'),
          rate: rate
        });
      } else {
        answer[languageName.toLowerCase()] = [{
          name: $(e).find('span:last-child').text().trim(),
          path: $(e).attr('href'),
          rate: rate
        }];
      }
    });
  } else {
    if (options.language) {
      const subtitleElements = $('td.a1 a');
      for (let i = 0; i < subtitleElements.length; i++) {
        const languageCode = langs.subsceneLangs[$(subtitleElements[i]).find('span:first-child').text().trim()]
        if (options.language.includes(languageCode)) {
          const languageName = langs.isoLangs[languageCode].name;
          const rateClass = $(subtitleElements[i]).find('span:first-child').attr('class');
          const rate = rateClass.includes('positive') ? 'positive' : rateClass.includes('neutral') ? 'neutral' : 'bad'

          if (options.rate && !options.rate.includes(rate)) {
            continue;
          }

          if (answer[languageName.toLowerCase()]) {
            answer[languageName.toLowerCase()].push({
              name: $(subtitleElements[i]).find('span:last-child').text().trim(),
              path: $(subtitleElements[i]).attr('href'),
              rate: rate
            });
          } else {
            answer[languageName.toLowerCase()] = [{
              name: $(subtitleElements[i]).find('span:last-child').text().trim(),
              path: $(subtitleElements[i]).attr('href'),
              rate: rate
            }];
          }
        }
      }
    } else if (!options.language) {
      const subtitleElements = $('td.a1 a');
      for (let i = 0; i < subtitleElements.length; i++) {
        const languageCode = langs.subsceneLangs[$(subtitleElements[i]).find('span:first-child').text().trim()]
        const languageName = langs.isoLangs[languageCode].name;
        const rateClass = $(subtitleElements[i]).find('span:first-child').attr('class');
        const rate = rateClass.includes('positive') ? 'positive' : rateClass.includes('neutral') ? 'neutral' : 'bad'

        if (options.rate && !options.rate.includes(rate)) {
          continue;
        }

        if (answer[languageName.toLowerCase()]) {
          answer[languageName.toLowerCase()].push({
            name: $(subtitleElements[i]).find('span:last-child').text().trim(),
            path: $(subtitleElements[i]).attr('href'),
            rate: rate
          });
        } else {
          answer[languageName.toLowerCase()] = [{
            name: $(subtitleElements[i]).find('span:last-child').text().trim(),
            path: $(subtitleElements[i]).attr('href'),
            rate: rate
          }];
        }
      }
    }
  }

  return answer;
}

async function downloadSubtitle(path, options) {
  const downloadPath = await getDownloadPath(path);

  const response = await got({
    url: `${ssBaseURL}${downloadPath}`,
    responseType: 'buffer',
    method: 'GET'
  });

  if (response.statusCode === 200) {
    if (options.unzip) {
      let answer = [];

      const zip = new AdmZip(response.body);
      const zipEntries = zip.getEntries();
      zipEntries.forEach(function (zipEntry) {
        if (zipEntry.entryName.endsWith('.srt') || zipEntry.entryName.endsWith('.vtt')) {
          answer.push({
            fileName: zipEntry.entryName,
            buffer: zipEntry.getData()
          });
        }
      });
      if (!options.convert) {
        return answer;
      } else {
        for (let i = 0; i < answer.length; i++) {
          const vttStr = convert(answer[i].buffer.toString('utf-8'));
          answer[i].buffer = Buffer.from(vttStr, 'utf-8');
          answer[i].fileName = answer[i].fileName.replace('srt', 'vtt');
        }
        return answer;
      }
    } else {
      return [{
        fileName: response.headers['content-disposition'].split('filename=')[1].split(';')[0],
        buffer: response.body
      }];
    }
  }
}

function convert(str) {
  return str.replace(/\{\\([ibu])\}/g, '</$1>')
    .replace(/\{\\([ibu])1\}/g, '<$1>')
    .replace(/\{([ibu])\}/g, '<$1>')
    .replace(/\{\/([ibu])\}/g, '</$1>')
    .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2')
    .concat('\r\n\r\n');
}

async function getDownloadPath(path) {
  const response = await got({
    url: `${ssBaseURL}${path}`,
    method: 'GET'
  });

  if (response.statusCode === 200) {
    const $ = cheerio.load(response.body);
    return $('#downloadButton').attr('href');
  }
}

module.exports.searchByTitle = searchByTitle;
module.exports.getSubtitleByImdbId = getSubtitleByImdbId;
module.exports.getTitleDetails = getTitleDetails;
module.exports.downloadSubtitle = downloadSubtitle;
