/*
  Description:
    This function deletes all the Firebase documents in the playbyplay 
    collection from the previous day.

  Schedule: Runs 1pm EDT

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

    // Call the today api and get the scoareboad api URL
    axios.get(todayApi).then(response => {
      const todaysScoreboardApi =
        // 'http://data.nba.net/prod/v2/20190713/scoreboard.json';
        apiBaseURL + response.data.links.todayScoreboard;
      // const date = response.data.links.currentDate;

      // Call the scoreboard api
      axios.get(todaysScoreboardApi).then(response => {
        let todaysGames = response.data.games;

        // Save to firestore
        let docRef = db.collection('playbyplay').doc('nba');
        docRef.set({
          todaysGames: todaysGames
        });

        // TODO Gets the first days games start time and save to times.json file.
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

        //  If the app crashes then on restart it will get all the play by play data
        todaysGames.forEach(game => {
          getGamePbp.start(game.gameId);
        });
      });
    });
  });
})();
