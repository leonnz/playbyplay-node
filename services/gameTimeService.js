/*
    Description:
        This is the main scheduler function that is always running.

*/

const fs = require('fs');
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
  console.log(start);

  var updateGamesSchedule = schedule.scheduleJob(
    { start: start, rule: '*/1 * * * * *' },
    function() {
      // Check if games are active otherwise exit scheduler.

      axios.get(startData.scoreboardApi).then(response => {
        let todaysGames = response.data.games.filter(game => {
          // return game.isGameActivated == true;
          return true;
        });

        if (todaysGames.length > 0) {
          console.log('yep');
          // getGamePbp.start(getStartData);
          // getScoreboard.start();
        } else {
          updateGamesSchedule.cancel();
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
