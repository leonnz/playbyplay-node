const axios = require('axios');
const db = require('./firebase');

const apiBaseURL = 'http://data.nba.net';
const todaysApisUrl = apiBaseURL + '/prod/v3/today.json';
let currentDate = '';

const getTodaysGames = () => {
  try {
    axios.get(todaysApisUrl).then(response => {
      currentDate = response.data.links.currentDate;
      const todaysScoreboard = apiBaseURL + response.data.links.todayScoreboard;
      axios.get(todaysScoreboard).then(response => {
        todaysGames = response.data.games;
        // Save to firestore
        let docRef = db.collection('playbyplay').doc('nba');
        docRef.set({
          todaysGames: todaysGames
        });

        // For each game get the play by plays and save to firestore
        todaysGames.forEach(game => {
          const gameUrl =
            apiBaseURL +
            '/json/cms/noseason/game/' +
            currentDate +
            '/' +
            game.gameId +
            '/pbp_all.json';
          axios.get(gameUrl).then(response => {
            // Save to firestore if plays is not empty
            let plays = response.data.sports_content.game.play;
            if (plays !== undefined) {
              let docRef = db
                .collection('playbyplay')
                .doc('game-' + game.gameId);
              docRef.set(
                {
                  plays: plays.reverse()
                },
                { merge: true }
              );
            }
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
};

getTodaysGames();
