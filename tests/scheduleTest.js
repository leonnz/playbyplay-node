/**
 *    Game Time Schedule
 *
 *    1. At 5.00pm UTC everyday this schedule runs on a Heroku worker process.
 *    2. Gets the days first game start time and pass it to the gametime service.
 *    2. The gametime service runs every 24 seconds and checks for active games and populates the play by play data.
 *
 */

const fs = require('fs');
const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

const prod = { hour: 17, minute: 0, dayOfWeek: new schedule.Range(0, 6) };
const test = '*/5 * * * * *';

const mainScheduleRule = test; // Main schedule run time, 4.30pm UTC everyday.
const gameTimeScheduleRule = '*/24 * * * * *'; // Gametime schedule run time, every 24 seconds.
const jsonStartTimeFile = './data/start_time.json'; // File with the first days game start time.

const mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {
  const startTimeFile = fs.readFileSync(jsonStartTimeFile);
  const startTime = JSON.parse(startTimeFile).gameStartTime;
  console.log(startTime);
  gameTimeService(startTime);
});

/**
 *
 * @param {String} startTime The start time of the game time service.
 */
const gameTimeService = function(startTime) {
  const date = new Date();
  console.log('This indeed did run at: ' + date);
  console.log(
    'and the passed in start time for the gameTime service is: ' + startTime
  );
  const gameTimeSchedule = schedule.scheduleJob(
    {
      start: startTime,
      rule: gameTimeScheduleRule
    },
    () => {
      getStartData.then(startData => {
        axios.get(startData.scoreboardApi).then(response => {
          let todaysActiveGames = response.data.games.filter(game => {
            return game.isGameActivated == true && game.period.current !== 0;
          });
          if (todaysActiveGames.length > 0) {
            getScoreboard.start();
            todaysActiveGames.forEach(game => {
              getGamePbp.start(game.gameId);
            });
          } else {
            getScoreboard.start();
            gameTimeSchedule.cancel();
            console.log('No active games');
          }
        });
      });
    }
  );
};
