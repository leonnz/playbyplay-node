const axios = require('axios');
const db = require('./firebase');

const apiBaseURL = 'http://data.nba.net';
const todaysApisUrl = apiBaseURL + '/prod/v3/today.json';

const getTodaysGames = () => {
  try {
    axios.get(todaysApisUrl).then(response => {
      const todaysScoreboard = apiBaseURL + response.data.links.todayScoreboard;
      axios.get(todaysScoreboard).then(response => {
        todaysGames = response.data.games;
        // save to firestore
        let docRef = db.collection('playbyplay').doc('nba');
        docRef.set({
          todaysGames: todaysGames
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

getTodaysGames();
