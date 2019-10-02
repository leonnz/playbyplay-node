/**
 *    Reload Test Data Schedule
 *
 *    A test version of the reloadData.js schedule that can be run manually.
 *
 */

const fs = require('fs');
const axios = require('axios');
const db = require('../services/firebase');
const getGamePbpTestData = require('../tests/getGamePbpTestData');
const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

(function() {
  console.log('reloadTestData.js ran');
  let collection = db.collection('playbyplay').get();

  collection.then(querySnapshot => {
    querySnapshot.docs.forEach(doc => {
      db.collection('playbyplay')
        .doc(doc.id)
        .delete();
    });

    axios.get(todayApi).then(response => {
      // test
      // const scoreboardApiUrl =
      //   'http://data.nba.net/prod/v2/20190713/scoreboard.json';
      const scoreboardApiUrl =
        'http://data.nba.net/prod/v2/20190930/scoreboard.json';
      const date = '20190713';
      // prod

      // const scoreboardApiUrl = apiBaseURL + response.data.links.todayScoreboard;
      // const date = response.data.links.currentDate;

      axios.get(scoreboardApiUrl).then(response => {
        let todaysGames = response.data.games;

        const gameStartTime = todaysGames[0].startTimeUTC;

        console.log(gameStartTime);

        fs.writeFile(
          'start_time.json',
          JSON.stringify({ gameStartTime }),
          function(err) {
            if (err) throw err;
            console.log('Time file saved');
          }
        );

        todaysGames.forEach(game => {
          let gameDoc = db.collection('playbyplay').doc(`game-${game.gameId}`);
          gameDoc.set({
            gameId: game.gameId,
            isGameActivated: game.isGameActivated,
            startTimeUTC: game.startTimeUTC,
            endTimeUTC: game.endTimeUTC || '',
            period: game.period.current,
            vTeamName: game.vTeam.triCode,
            vTeamScore: game.vTeam.score || '0',
            hTeamName: game.hTeam.triCode,
            hTeamScore: game.hTeam.score || '0',
            zPlayByPlay: []
          });
        });

        todaysGames.forEach(game => {
          getGamePbpTestData.start(game.gameId, date);
        });
      });
    });
  });
})();
