/**
 *    Game playby play service
 *
 *    1. For each game that is active, call the playbyplay API url.
 *    2. Save the playbyplay data to Firestore.
 */

const axios = require('axios');
const db = require('../services/firebase');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');

const apiBaseURL = 'http://data.nba.net';

const recurrence = '*/2 * * * * *';

/**
 *
 * @param {String} gameId The gameId of the game.
//  * @param {String} date The date for todays game.
 */
function getGamepbp(gameId, gameStartTime) {
  console.log(gameId + gameStartTime);

  let eventCounter = 0;

  const gameTimeSchedule = schedule.scheduleJob(
    {
      start: gameStartTime,
      rule: recurrence
    },
    () => {
      console.log('running...');
      // Call the pbp api
      getStartData.then(startData => {
        axios.get(startData.scoreboardApi).then(response => {
          // get the game status
          const status = response.data.games.filter(
            game => game.gameId == gameId
          )[0].statusNum;

          if (status == 3) {
            // Status 3 = game finished.
            const pbpApiUrl = `${apiBaseURL}/json/cms/noseason/game/${startData.currentDate}/${gameId}/pbp_all.json`;

            axios.get(pbpApiUrl).then(response => {
              const pbp = response.data.sports_content.game.play;
              // check if pbp is not empty
              if (pbp.length !== 0 && pbp.length > eventCounter) {
                // Start the queue logic
                // Push event
                console.log(pbp[counter]);
                // increment by 1
                eventCounter++;
              }
            });
          } else {
            gameTimeSchedule.cancel();
          }
        });
        // axios.get(gameUrl).then(response => {
        //   // Save to firestore if plays is not empty
        //   let plays = response.data.sports_content.game.play;
        //   if (plays !== undefined) {
        //     let docRef = db.collection('playbyplay').doc('game-' + gameId);
        //     docRef.set(
        //       {
        //         plays: plays
        //       },
        //       { merge: true }
        //     );
        //   }
        // });
      });
      console.log('getGamesPbp.js ran');
    }
  );

  // getStartData.then(startData => {
  //   const gameUrl = `${apiBaseURL}/json/cms/noseason/game/${startData.currentDate}/${gameId}/pbp_all.json`;
  //   console.log(gameUrl);
  //   axios.get(gameUrl).then(response => {
  //     // Save to firestore if plays is not empty
  //     let plays = response.data.sports_content.game.play;
  //     if (plays !== undefined) {
  //       let docRef = db.collection('playbyplay').doc('game-' + gameId);
  //       docRef.set(
  //         {
  //           plays: plays
  //         },
  //         { merge: true }
  //       );
  //     }
  //   });
  // });
  // console.log('getGamesPbp.js ran');
}

module.exports.start = getGamepbp;
