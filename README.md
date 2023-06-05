# node-subtitle-tools

A package for fetching and editing subtitles from subscene.com

# Usage

1. Import the package

```javascript
const { subscene } = require("node-subtitle-tools");
```

2. Search for subtitles

```javascript
const results = await subscene.searchByTitle("Iron Man");
console.log(results);
```

Example output:

```json
[
  { "title": "Iron Man (2008)", "path": "/subtitles/iron-man" },
  { "title": "Iron Man (1994)", "path": "/subtitles/iron-man-1994-1" },
  { "title": "Iron Man (1966)", "path": "/subtitles/iron-man-1966" }
  ...
]
```

3. Get title details

```javascript
const details = await subscene.getTitleDetails(
  results[0].path, // path from results
  true, // Including subtitles
  {
    language: ["en"], // language options
    //rate: ['positive'] // rating options, 'positive' | 'neutral' | 'bad'
  }
);
console.log(details);
```

Example output:

```json
{
  "title": "Iron Man",
  "imdb": "tt0371746",
  "path": "/subtitles/iron-man",
  "subtitles": {
    "english": [
      {
        "name": "Marvel.Studios'.Iron.Man.2008.WEB-DL.DSNP",
        "path": "/subtitles/iron-man/english/2442746",
        "rate": "positive"
      },
      {
        "name": "IronMan.brrip.2008.1080p",
        "path": "/subtitles/iron-man/english/1738245",
        "rate": "positive"
      },
      {
        "name": "Iron.Man_DvDrip-aXXo_IMPROVED",
        "path": "/subtitles/iron-man/english/1359171",
        "rate": "positive"
      }
      ...
    ]
  }
}
```

4. Download subtitle

```javascript
const downloadedFiles = await subscene.downloadSubtitle(
  details.subtitles["english"][0].path,
  {
    unzip: true, //Unzip the subtitle
    convert: true, // Convert the subtitle to vtt
  }
);
console.log(downloadedFiles);
```

Example output:

```json
[
  {
    "fileName": "Marvel.Studios'.Iron.Man.2008.WEB-DL.DSNP.vtt",
    "buffer": "<Buffer 31 0d 0a 30 30 3a 30 30 3a 34 38 2e 31 36 30 20 2d 2d 3e 20 30 30 3a 30 30 3a 35 30 2e 31 36 30 0d 0a 3c 69 3e 28 42 41 43 4b 20 49 4e 20 42 4c 41 43 ... 124634 more bytes>"
  }
]
```

Or you can use `getSubtitleByImdbId()` function to get the list of subtitle (but slower):

```javascript
const apiKey = "Your_TMDB_API_KEY..."; // TMDB API KEY

const details = await subscene.getSubtitleByImdbId(
  "tt4154796", // IMDb ID
  apiKey, // TMDB API KEY
  {
    language: ["en"], // language options
    //rate: ['positive'] // rating options, 'positive' | 'neutral' | 'bad'
  }
);
console.log(details);
```

Example output:

```json
{
  "english": [
    {
      "name": "Marvel.Studios'.Avengers.Endgame.2019.WEB-DL.DSNP",
      "path": "/subtitles/avengersendgame/english/2413267",
      "rate": "neutral"
    },
    {
      "name": "Marvel Studios Avengers: Endgame",
      "path": "/subtitles/avengersendgame/english/2041927",
      "rate": "positive"
    },
    {
      "name": "Avengers3Endgame.brrip.2019.1080p",
      "path": "/subtitles/avengersendgame/english/2052451",
      "rate": "positive"
    },
    ...
    ]
}
```
