const schedule = require('node-schedule');
const fs = require('fs');

var currentTime = new Date();

//  This schedule should pick up the first days games start time from the json file once a day
//  after the reloadData service has run.

var mainScheduleRule = '*/5 * * * * *';
var gameTimeScheduleRule = '*/1 * * * * *';
var jsonTimeFile = './times.json';

var mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {
  var startTimeFile = fs.readFileSync(jsonTimeFile);
  var startTime = JSON.parse(startTimeFile).startTime;

  //  Pass the start time to the gameTimeService
  gameTimeService(currentTime.setSeconds(currentTime.getSeconds() + 10));
});

//  At the first game start time, this service runs every 24 seconds and checks the scoreboard for active games.
//  If there are active games then update game playbyplays and scoreboard.
//  If there are no active games, call the scoreboard one more time and cancel the schedule.
function gameTimeService(startTime) {
  var gameTimeSchedule = schedule.scheduleJob(
    {
      start: startTime,
      rule: gameTimeScheduleRule
    },
    () => {
      console.log('Second schedule');
    }
  );
}
