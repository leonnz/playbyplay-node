const axios = require('axios');
const db = require('./firebase');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

const startData = require('./getStartData');

startData.then(data => {
  console.log(data.scoreboardApi);
});

var add_minutes = function(dt, minutes) {
  return new Date(dt.getTime() + minutes * 60000);
};
var start = add_minutes(new Date(), 0).toString();

var j = schedule.scheduleJob(
  { start: start, rule: '*/10 * * * * *' },
  function() {
    startData.then(startData => {
      // Call the scoreboard api and get active games
      axios.get(startData.scoreboardApi).then(response => {
        let todaysGames = response.data.games;

        todaysGames.forEach(game => {
          // let active = game.isGameActivated;
          let active = true;
          // Poll active games for plays
          if (active) {
            const gameUrl = `${apiBaseURL}/json/cms/noseason/game/${
              startData.apiDate
            }/${game.gameId}/pbp_all.json`;

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
          }
        });
      });
    });
  }
);
