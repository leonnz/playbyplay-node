const axios = require('axios');
const db = require('./firebase');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

(function() {
  // Delete the existing NBA document
  db.collection('playbyplay')
    .doc('nba')
    .delete();

  console.log('NBA document deleted.');

  // Call the today api and get the scoareboad api URL
  axios.get(todayApi).then(response => {
    const todaysScoreboardApi =
      apiBaseURL + response.data.links.todayScoreboard;
    const date = response.data.links.currentDate;

    // Call the scoreboard api
    axios.get(todaysScoreboardApi).then(response => {
      let todaysGames = response.data.games;

      // Save to firestore
      let docRef = db.collection('playbyplay').doc('nba');
      docRef.set({
        date: date,
        todaysGames: todaysGames
      });
      console.log('New NBA document saved.');
    });
  });
})();
