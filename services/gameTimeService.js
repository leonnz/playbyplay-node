/*
    Description:
        This is the main scheduler function that is always running.

*/

const axios = require('axios');
const schedule = require('node-schedule');
const getStartData = require('../data/getStartData');
const getGamePbp = require('../data/getGamePbp');
const getScoreboard = require('../data/getScoreboard');

getStartData.then(startData => {
  let start = new Date(startData.startTime);

  var updateGamesSchedule = schedule.scheduleJob(
    { start: start, rule: '*/30 * * * * *' },

    function() {
      // Check if games are active otherwise exit scheduler
      axios.get(startData.scoreboardApi).then(response => {
        let todaysActiveGames = response.data.games.filter(game => {
          return game.isGameActivated == true && game.period.current !== 0;
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
