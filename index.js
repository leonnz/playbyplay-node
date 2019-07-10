const axios = require('axios');
const db = require('./firebase');

const apiBaseURL = 'http://data.nba.net';
const todayApi = apiBaseURL + '/prod/v3/today.json';

const getTodaysGames = () => {
  // Call the today api
  axios.get(todayApi).then(response => {
    const todaysScoreboardApi =
      apiBaseURL + response.data.links.todayScoreboard;
    const date = response.data.links.currentDate;

    // Call the scoreboard api
    axios.get(todaysScoreboardApi).then(response => {
      let todaysGames = response.data.games;

      // Save to firestore
      let docRef = db.collection('playbyplay').doc('nba');
      docRef.set({
        date: date,
        todaysGames: todaysGames
      });
    });
  });
};

// This function will compare the existing date in the firestore database and
// compare it to the date from the http://data.nba.net/prod/v3/today.json api.
//
// If the dates match then continue to poll the api for date changes.
// If the dates are different then delete the document repository (NBA) and
// load the new games: getTodaysGames().
const compareDates = dbDate => {
  axios.get(todayApi).then(response => {
    let apiDate = response.data.links.currentDate;
    console.log(apiDate, dbDate);

    if (apiDate === dbDate) {
      // Compare every # minutes
      setInterval(() => {
        compareDates(dbDate);
      }, 2000);
    } else {
      // Delete the collection and set it with todays games list.
      db.collection('playbyplay')
        .doc('nba')
        .delete();
      getTodaysGames();
      console.log('Deleted old games, set new games.');

      //Run a function to poll the scoreboard api while games are active
    }
  });
};

// Run this on a schedule
const checkTodayApi = () => {
  let nbaDoc = db.collection('playbyplay').doc('nba');
  nbaDoc
    .get()
    .then(doc => {
      if (!doc.exists) {
        // Send new data
        getTodaysGames();
      } else {
        console.log('Already exists.');
        compareDates(doc.data().date);
      }
    })
    .catch(err => {
      console.log('Error getting document', err);
    });
};

// This function needs to run on a schedule during the window the api is updated.
// const getTodaysGames = () => {
//   try {
//     let existingDate = getExistingDataDate();

//     axios.get(todaysApisUrl).then(response => {
//       apiDate = response.data.links.currentDate;

//       // If existingdate and apidate match keep running
//       if (apiDate === existingDate) {
//         getTodaysGames();
//       } else {
//         // If they dont match update it
//         const todaysScoreboard =
//           apiBaseURL + response.data.links.todayScoreboard;

//         axios.get(todaysScoreboard).then(response => {
//           todaysGames = response.data.games;

//           // Save to firestore
//           let docRef = db.collection('playbyplay').doc('nba');
//           docRef.set({
//             date: apiDate,
//             todaysGames: todaysGames
//           });

//           // For each game get the play by plays and save to firestore
//           todaysGames.forEach(game => {
//             const gameUrl =
//               apiBaseURL +
//               '/json/cms/noseason/game/' +
//               apiDate +
//               '/' +
//               game.gameId +
//               '/pbp_all.json';
//             axios.get(gameUrl).then(response => {
//               // Save to firestore if plays is not empty
//               let plays = response.data.sports_content.game.play;
//               if (plays !== undefined) {
//                 let docRef = db
//                   .collection('playbyplay')
//                   .doc('game-' + game.gameId);
//                 docRef.set(
//                   {
//                     plays: plays.reverse()
//                   },
//                   { merge: true }
//                 );
//               }
//             });
//           });
//         });
//       }
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

checkTodayApi();
