/**
 * At 5.00pm UTC everyday this schedule runs.
 *
 *    1. Get the days first game start time and pass it to the gametime service.
 *    2. The gametime service runs every 24 seconds and checks for active games and populates the play by play data.
 */

const fs = require('fs');
const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

const prod = { hour: 17, minute: 0, dayOfWeek: new schedule.Range(0, 6) };
const test = '*/5 * * * * *';

const mainScheduleRule = prod; // Main schedule run time, 4.30pm UTC everyday.
const gameTimeScheduleRule = '*/24 * * * * *'; // Gametime schedule run time, every 24 seconds.
const jsonStartTimeFile = '../data/start_time.json'; // File with the first days game start time.

//  Gets the first game start time and kicks off the gametime service.
var mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {
  var startTimeFile = fs.readFileSync(jsonStartTimeFile);
  var startTime = JSON.parse(startTimeFile).gameStartTime;
  //var testStartTime = new Date();
  console.log(startTime);
  gameTimeService(startTime);
});

//  At the first game start time, this service runs every 24 seconds and checks the scoreboard for active games.
//  If there are active games then update game playbyplays and scoreboard.
//  If there are no active games, call the scoreboard one more time and cancel the schedule.
const gameTimeService = function(startTime) {
  var gameTimeSchedule = schedule.scheduleJob(
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
