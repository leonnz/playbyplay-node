/*
    Description:
    
    This is the main scheduler function that is always running 24/7 on a Heroku worker process.

*/

const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

//  Every 30 mins check the scoreboard for active games.
var mainSchedule = schedule.scheduleJob({ rule: '*/10 * * * * *' }, () => {
  console.log('doing something every 10 seconds');
  getStartData.then(startData => {
    axios.get(startData.scoreboardApi).then(response => {
      let todaysActiveGames = response.data.games.filter(game => {
        return game.isGameActivated == true && game.period.current !== 0;
      });
      //  If there are actiuve games then update game playbyplays and scoreboard every 24 seconds
      if (todaysActiveGames.length == 0) {
        var updateGamesSchedule = schedule.scheduleJob(
          { rule: '*/1 * * * * *' },
          () => {
            console.log('doing something every 1 seconds');
            todaysActiveGames.forEach(game => {
              getGamePbp.start(game.gameId);
            });
            getScoreboard.start();
          }
        );
      } else {
        //  There are no active games, call the scoreboard one more time and cancel the job.
        getScoreboard.start();
        updateGamesSchedule.cancel();
      }
    });
  });
});
