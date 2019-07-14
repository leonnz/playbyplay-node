/*
    Description:
        This is the main scheduler function that is always running.

*/

// const fs = require('fs');
const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

// var startTimePlusSeconds = JSON.parse(fs.readFileSync('./times.json'))
//   .startTime;

// var endTimePlusSeconds = JSON.parse(fs.readFileSync('./times.json')).endTime;

// let startTime = new Date(Date.now() + startTimePlusSeconds);
// let endTime = new Date(startTime.getTime() + endTimePlusSeconds);

// var startTimeFromFile = JSON.parse(fs.readFileSync('../data/times.json'))
//   .startTime;

// // var endTime = JSON.parse(fs.readFileSync('./times.json')).endTime;

// let startTime = new Date(new Date(startTimeFromFile));

// Get the days first game start time
getStartData.then(startData => {
  let start = new Date(startData.startTime);

  // let dateNow = new Date();
  // console.log(start, dateNow);

  var updateGamesSchedule = schedule.scheduleJob(
    { start: start, rule: '*/30 * * * * *' },

    function() {
      // Check if games are active otherwise exit scheduler
      axios.get(startData.scoreboardApi).then(response => {
        let todaysActiveGames = response.data.games.filter(game => {
          return game.isGameActivated == true && game.period.current !== 0;

          // for getting finished games data
          //return true;
        });

        // Update game playbyplays and scoreboard
        if (todaysActiveGames.length > 0) {
          todaysActiveGames.forEach(game => {
            getGamePbp.start(game.gameId);
          });
          getScoreboard.start();
        } else {
          // Call the scoreboard one more time
          getScoreboard.start();
          updateGamesSchedule.cancel();
          console.log('No active games');
        }
      });
    }
  );
});
// Checking for new start and end times
// const watcher = fs.watch('../data/times.json', (eventType, fileName) => {
//   console.log(eventType, fileName);
//   // startTimePlusSeconds = JSON.parse(fs.readFileSync('../data/times.json')).startTime;
//   // endTimePlusSeconds = JSON.parse(fs.readFileSync('../data/times.json')).endTime;
// });

// watcher.close();
