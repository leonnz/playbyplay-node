/*
  Description:
    This function deletes all the Firebase documents in the playbyplay 
    collection from the previous day.

  Schedule: Runs 1pm EDT

*/

const fs = require('fs');
const axios = require('axios');
const db = require('../services/firebase');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

(function() {
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

        // Set first game start time in times.json
        let startTime = todaysGames.map(({ startTimeUTC }) => startTimeUTC)[0];
        fs.writeFile('times.json', JSON.stringify({ startTime }), function(
          err
        ) {
          if (err) throw err;
          console.log('Time file saved');
        });
      });
    });
  });
})();
