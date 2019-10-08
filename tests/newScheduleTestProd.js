/**
 *    Game Time Schedule
 *
 *    1. At 5.00pm UTC every day this schedule runs on a Heroku worker process.
 *    2. Gets the days first game start time and pass it to the gametime service.
 *    2. The gametime service runs every 24 seconds and checks for active games and populates the play by play data.
 *
 *    Schedule time equivalents
 *      - 5pm UTC
 *      - 1pm EDT (USA)
 *      - 3am AEDT (Melbourne, following day)
 *
 *    The schedule starts at 1pm EDT presuming the NBA API is refreshed at 12pm EDT.
 *    The schedule relies on the reloadData.js script to have run at 4.40pm UTC.
 */

// const fs = require('fs');
const db = require('../services/firebase');
const axios = require('axios');
const schedule = require('node-schedule');
const getGamePbpTest = require('./getGamePbpTest');

const nbaApiBaseUrl = 'http://data.nba.net';
const nbaApiTodayUrl = 'http://data.nba.net/prod/v3/today.json';

const mainScheduleRule = {
  hour: 17,
  minute: 0,
  dayOfWeek: new schedule.Range(0, 6)
};

const mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {
  console.log('This ran at ' + new Date());

  axios.get(nbaApiTodayUrl).then(response => {
    const nbaApiTodayScoreboardUrl =
      nbaApiBaseUrl + response.data.links.todayScoreboard;
    console.log('Scoreboard url ' + nbaApiTodayScoreboardUrl);

    const currentDate = response.data.links.currentDate;
    console.log('Current date: ' + currentDate);

    db.collection('playbyplay')
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          getGamePbpTest.start(
            doc.data().gameId,
            doc.data().startTimeUTC,
            nbaApiTodayScoreboardUrl,
            currentDate
          );
        });
      });
  });
});

// Only for manually testing
// (function test() {
//   db.collection('playbyplay')
//     .get()
//     .then(function(querySnapshot) {
//       querySnapshot.forEach(function(doc) {
//         getGamePbpTest.start(doc.data().gameId, doc.data().startTimeUTC);
//       });
//     });
// })();

// const mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {

// try {
//   const startTimeFile = fs.readFileSync(jsonStartTimeFile);

//   if (startTimeFile.byteLength > 0) {
//     const startTime = JSON.parse(startTimeFile).gameStartTime;
//     gameTimeService(startTime);
//   }
// } catch (error) {
//   console.log(
//     'Something went wrong reading the start_time.json file: ' + error
//   );
// }

// });
