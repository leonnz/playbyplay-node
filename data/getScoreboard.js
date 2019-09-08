/*
  Description:
    This function updates the main NBA document with the games and scores.

*/

const axios = require('axios');
const db = require('../services/firebase');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

function getScoreBoard() {
  // Call the today api and get the scoareboad api URL
  axios.get(todayApi).then(response => {
    const todaysScoreboardApi =
      // 'http://data.nba.net/prod/v2/20190713/scoreboard.json';
      apiBaseURL + response.data.links.todayScoreboard;

    // Call the scoreboard api
    axios.get(todaysScoreboardApi).then(response => {
      let todaysGames = response.data.games;

      // Save to firestore
      let docRef = db.collection('playbyplay').doc('nba');
      docRef.set(
        {
          todaysGames: todaysGames
        },
        { merge: true }
      );
    });
  });
  // console.log('getScoreboard.js ran');
}

module.exports.start = getScoreBoard;
