const axios = require('axios');
const download = require('download-file');
const fs = require('fs');

let apiPlayersUrl = 'http://data.nba.net/prod/v1/2019/players.json';

(function main() {
  axios
    .get(apiPlayersUrl)
    .then(response => {
      let players = response.data.league.standard;

      var failFile = fs.createWriteStream('../services/logs/results-fail.txt', {
        flags: 'a'
      });
      var successFile = fs.createWriteStream(
        '../services/logs/playerIds.json',
        {
          flags: 'a'
        }
      );

      players.forEach(player => {
        let playerPicUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${
          player.personId
        }.png`;
        var options = {
          directory: '../images/players',
          filename: `${player.personId}.png`
        };

        download(playerPicUrl, options, function(err) {
          if (err) {
            let output = `Couldn't download image for: ${player.firstName} ${
              player.lastName
            } PlayerId: ${player.personId}`;
            failFile.write(output + '\n');
          }
        });
      });
      let files = fs.readdirSync('../images/players/');
      let ids = files.map(file => file.replace(/\.[^/.]+$/, ''));
      let idsJson = JSON.stringify(ids);
      successFile.write(idsJson);
    })
    .catch(function(error) {
      console.log(error);
    })
    .finally(function() {
      console.log('Downloader finished.');
    });
})();
