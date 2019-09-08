/*
  Description: 
    This function loads the play by play data into firestore for active games.

    Schedule: 
      Runs at the first game start time.
      Ends when no more games are active.
*/

const axios = require('axios');
const db = require('../services/firebase');
const getStartData = require('./getStartData');
const apiBaseURL = 'http://data.nba.net';

function getGamepbp(game) {
  // console.log(game);
  getStartData.then(startData => {
    const gameUrl = `${apiBaseURL}/json/cms/noseason/game/${
      startData.apiDate
      // '20190713'
    }/${game}/pbp_all.json`;

    axios.get(gameUrl).then(response => {
      // Save to firestore if plays is not empty
      let plays = response.data.sports_content.game.play;
      if (plays !== undefined) {
        let docRef = db.collection('playbyplay').doc('game-' + game);
        docRef.set(
          {
            plays: plays
          },
          { merge: true }
        );
      }
    });
  });
  // console.log('getGamesPbp.js ran');
}

module.exports.start = getGamepbp;
