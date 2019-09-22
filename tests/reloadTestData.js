/**
 *    Reload Test Data Schedule
 *
 *    A test version of the reloadData.js schedule that can be run manually.
 *
 */

const fs = require('fs');
const axios = require('axios');
const db = require('../services/firebase');
const getGamePbp = require('../data/getGamePbp');
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
      const todaysScoreboardApi =
        'http://data.nba.net/prod/v2/20190713/scoreboard.json';
      const date = '20190713';

      axios.get(todaysScoreboardApi).then(response => {
        let todaysGames = response.data.games;

        let docRef = db.collection('playbyplay').doc('nba');
        docRef.set({ todaysGames: todaysGames });

        const gameStartTime = todaysGames[0].startTimeUTC;

        console.log(gameStartTime);

        fs.writeFile(
          'start_time_test.json',
          JSON.stringify({ gameStartTime }),
          function(err) {
            if (err) throw err;
            console.log('Time file saved');
          }
        );

        todaysGames.forEach(game => {
          getGamePbp.start(game.gameId, date);
        });
      });
    });
  });
})();
