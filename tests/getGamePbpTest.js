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

const nbaApiPbpUrl = 'http://data.nba.net/json/cms/noseason/game';

/**
 *
 * @param {String} gameId The gameId of the game.
 * @param {String} gameStartTime The game start time in UTC.
 * @param {String} nbaApiTodayScoreboardUrl The URL for todays scoreboard.
 * @param {String} currentDate Todays date from the main API in format YYYYMMDD.
 */
function getGamepbp(
  gameId,
  gameStartTime,
  nbaApiTodayScoreboardUrl,
  currentDate
) {
  // let testScoreboardApiUrl =
  //   'http://data.nba.net/prod/v2/20190930/scoreboard.json';

  // let testDate = '20190930';
  // let testGameId = '0011900001';
  const gameTimeSchedule = schedule.scheduleJob(
    {
      start: gameStartTime,
      rule: '*/5 * * * * *'
    },
    () => {
      const gameDoc = db.collection('playbyplay').doc(`game-${gameId}`);

      axios.get(nbaApiTodayScoreboardUrl).then(response => {
        const game = response.data.games.filter(
          game => game.gameId == gameId
        )[0];
        if (game !== undefined && game !== null) {
          gameDoc.set(
            {
              isGameActivated: game.isGameActivated,
              endTimeUTC: game.endTimeUTC || '',
              statusNum: game.statusNum,
              clock: game.clock
            },
            { merge: true }
          );

          // if (game.statusNum == 3) { // For testing finished games
          if (game.statusNum !== 3) {
            // Status 3 = game finished.

            const pbpApiUrl = `${nbaApiPbpUrl}/${currentDate}/${gameId}/pbp_all.json`;

            axios.get(pbpApiUrl).then(response => {
              const pbp = response.data.sports_content.game.play;

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
                  console.log('added event for game: ' + gameId);
                }
              });
            });
          } else {
            console.log('No active game found with id: ' + gameId);
            gameTimeSchedule.cancel();
          }
        } else {
          console.log('No game found with id: ' + gameId);
          gameTimeSchedule.cancel();
        }
      });
    }
  );
}

module.exports.start = getGamepbp;
