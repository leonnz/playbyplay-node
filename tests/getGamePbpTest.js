/**
 *    Game playby play service
 *
 *    1. For each game that is active, call the playbyplay API url.
 *    2. Save the playbyplay data to Firestore.
 */

const axios = require('axios');
const db = require('../services/firebase');
const firebase = require('firebase-admin');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');

const apiBaseURL = 'http://data.nba.net';

const recurrence = '*/5 * * * * *';

/**
 *
 * @param {String} gameId The gameId of the game.
 * @param {String} gameStartTime The game start time in UTC.
 */
function getGamepbp(gameId, gameStartTime) {
  // let testScoreboardApiUrl =
  //   'http://data.nba.net/prod/v2/20190930/scoreboard.json';

  // let testDate = '20190930';
  // let testGameId = '0011900001';

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

              let gameDoc = db.collection('playbyplay').doc(`game-${gameId}`);

              gameDoc.get().then(response => {
                let zPlayByPlayLength = response.data().zPlayByPlay.length;
                // console.log('zPlayByPlayLength ' + zPlayByPlayLength);
                // console.log('pbp.length ' + pbp.length);

                // Start the queue logic
                if (pbp.length !== 0 && pbp.length > zPlayByPlayLength) {
                  // Push event
                  const lastEvent = pbp[zPlayByPlayLength];

                  // console.log(pbp[zPlayByPlayLength]);
                  gameDoc.update({
                    period: parseInt(lastEvent.period),
                    hTeamScore: lastEvent.home_score,
                    vTeamScore: lastEvent.visitor_score,
                    zPlayByPlay: firebase.firestore.FieldValue.arrayUnion(
                      lastEvent
                    )
                  });
                  console.log('added event for ...' + gameId);
                }
              });
            });
          } else {
            gameTimeSchedule.cancel();
          }
        });
      });
    }
  );
}

module.exports.start = getGamepbp;
