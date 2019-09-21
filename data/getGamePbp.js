/**
 *    Game playby play service
 *
 *    1. For each game that is active, call the playbyplay API url.
 *    2. Save the playbyplay data to Firestore.
 */

const axios = require('axios');
const db = require('../services/firebase');
const getStartData = require('./getStartData');
const apiBaseURL = 'http://data.nba.net';

/**
 *
 * @param {String} gameId The gameId of the game.
 * @param {String} date The date for todays game.
 */
function getGamepbp(gameId, date) {
  // console.log(game);
  getStartData.then(startData => {
    const gameUrl = `${apiBaseURL}/json/cms/noseason/game/${
      // startData.apiDate
      date
    }/${gameId}/pbp_all.json`;
    console.log(gameUrl);
    axios.get(gameUrl).then(response => {
      // Save to firestore if plays is not empty
      let plays = response.data.sports_content.game.play;
      if (plays !== undefined) {
        let docRef = db.collection('playbyplay').doc('game-' + gameId);
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
