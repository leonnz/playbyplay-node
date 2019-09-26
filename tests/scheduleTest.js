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

const fs = require('fs');
const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

const prod = { hour: 17, minute: 0, dayOfWeek: new schedule.Range(0, 6) };
const test = '*/5 * * * * *';

const mainScheduleRule = prod;
const gameTimeScheduleRule = '*/24 * * * * *';
const jsonStartTimeFile = './data/start_time.json';

const mainSchedule = schedule.scheduleJob({ rule: mainScheduleRule }, () => {
  try {
    const startTimeFile = fs.readFileSync(jsonStartTimeFile);

    if (startTimeFile.byteLength > 0) {
      const startTime = JSON.parse(startTimeFile).gameStartTime;
      console.log(startTime);
      gameTimeService(startTime);
    }
  } catch (error) {
    console.log(
      'Somehthing went wrong reading the start_time.json file: ' + error
    );
  }
});

/**
 *
 * @param {String} startTime The start time of the game time service.
 */
// TODO: Probably gonna need to refactor this to use a queue manager.
/**
 *  On the front end it gets messy to handle pbp data with a queue manager and game box data separately.
 *  Consider using a queue manager in this process for both pbp and gamebox data.
 *
 *  Instead of running the gameTimeService every 24 seconds run it once, each getGamePbp service will then run once,
 *  inside each getGamePbp service will a schedule, with a queue manager. The queue manager will as follows:
 *
 *  Initiate the 2 queue's, a main pbp queue and a dummy pbp queue behind the scenes which are identical at first.
 *  Only the dummy pbp queue is saved to Firestore.
 *
 *  At the schdeuled interval get the latest data from NBA API and save as the main pbp queue.
 *  If the main pbp queue array is greater than the dummy pbp queue array then push the last event from the main pbp queue onto
 *  the dummy pbp queue, repeat until the queues are the same length.
 *
 *  The main nba doc data may have to be merged with the game pbp docs.
 *
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
