const axios = require('axios');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

var startData = function() {
  return axios.get(todayApi).then(response => {
    const todaysScoreboardApi =
      // 'http://data.nba.net/prod/v2/20190713/scoreboard.json';
      apiBaseURL + response.data.links.todayScoreboard;
    const currentDate = response.data.links.currentDate;

    return axios.get(todaysScoreboardApi).then(response => {
      let obj = {
        currentDate: currentDate,
        startTime: response.data.games[0].startTimeUTC,
        scoreboardApi: todaysScoreboardApi
      };
      return obj;
    });
  });
};

module.exports = startData();
