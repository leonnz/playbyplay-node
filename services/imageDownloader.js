/**
 *    File downloader script for player profile pics.
 */

const fs = require('fs');
const axios = require('axios');
const download = require('download-file');

const apiPlayersUrl = 'http://data.nba.net/prod/v1/2019/players.json';
const playerImgUrl =
  'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/';

// const playerImgUrl =
//   'https://ak-static.cms.nba.com/wp-content/uploads/headshots/dleague/'; // D-League

const playerImagesFolder = '../images/players/';
// const playerImagesFolder = '../images/dleague/'; // D-League

const resultFailFile = '../services/logs/results-fail.txt';
const resultSuccessFile = '../services/logs/playerIds.json';

(function main() {
  axios
    .get(apiPlayersUrl)
    .then(response => {
      const players = response.data.league.standard;
      // const players = response.data.league.vegas; // D-League players

      const failFile = fs.createWriteStream(resultFailFile, {
        flags: 'a'
      });
      const successFile = fs.createWriteStream(resultSuccessFile, {
        flags: 'a'
      });

      players.forEach(player => {
        const playerPicUrl = `${playerImgUrl}${player.personId}.png`;
        const options = {
          directory: playerImagesFolder,
          filename: `${player.personId}.png`
        };

        download(playerPicUrl, options, function(err) {
          if (err) {
            const output = `Couldn't download image for: ${player.firstName} ${player.lastName} PlayerId: ${player.personId}`;
            failFile.write(output + '\n');
          }
        });
      });

      const files = fs.readdirSync(playerImagesFolder);
      const ids = files.map(file => file.replace(/\.[^/.]+$/, ''));
      const idsJson = JSON.stringify(ids);
      successFile.write(idsJson);
    })
    .catch(function(error) {
      console.log(error);
    })
    .finally(function() {
      console.log('Downloader finished.');
    });
})();
