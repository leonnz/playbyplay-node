/**
 *    Reload Data Schedule
 *
 *    1. At 4.30pm UTC this schedule runs using Heroku Scheduler.
 *    2. Delete's all game docs in the Firestore playbyplay collection.
 *    3. Calls the NBA api to get the days game data and save to Firestore game docs.
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
      const date = response.data.links.currentDate;
      const scoreboardApiUrl = apiBaseURL + response.data.links.todayScoreboard;

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
      });
    });
  });
})();
