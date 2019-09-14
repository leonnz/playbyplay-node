const axios = require('axios');
const apiUrl = 'http://data.nba.net/prod/v3/today.json';

test('The NBA API returns HTTP status 200', async () => {
  const response = await axios.get(apiUrl);
  expect(response.status).toBe(200);
});

test('The NBA API returns data', async () => {
  const response = await axios.get(apiUrl);
  expect(response.data).toBeDefined();
});
