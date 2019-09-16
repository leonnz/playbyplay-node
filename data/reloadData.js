/**
 *    Reload Data Schedule
 *
 *    1. At 4.30pm UTC this schedule runs using Heroku Scheduler.
 *    2. Delete's all doc's (nba and playbyplays) in the Firestore playbyplay collection.
 *    3. Calls the NBA api to get the days game data and save to Firestore 'nba' doc.
 *    4. Get's the first game start time for the day and saves to the json time file.
 */

const fs = require('fs');
const axios = require('axios');
const db = require('../services/firebase');
const getGamePbp = require('../data/getGamePbp');
const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

(function() {
  console.log('reloadData.js ran');
  let collection = db.collection('playbyplay').get();

  collection.then(querySnapshot => {
    querySnapshot.docs.forEach(doc => {
      db.collection('playbyplay')
        .doc(doc.id)
        .delete();
    });

    axios.get(todayApi).then(response => {
      // Test data
      const todaysScoreboardApi =
        'http://data.nba.net/prod/v2/20190713/scoreboard.json';
      const date = '20190713';
      // Prod
      // apiBaseURL + response.data.links.todayScoreboard;
      // const date = response.data.links.currentDate;

      axios.get(todaysScoreboardApi).then(response => {
        let todaysGames = response.data.games;

        let docRef = db.collection('playbyplay').doc('nba');
        docRef.set({ todaysGames: todaysGames });

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
          getGamePbp.start(game.gameId, date);
        });
      });
    });
  });
})();
