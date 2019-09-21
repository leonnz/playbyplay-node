/**
 *    A test gametime service that pushes test events into the Firestore game doc.
 */

const db = require('../services/firebase');
const schedule = require('node-schedule');

const testGameData = [
  {
    gameId: '0011900001',
    isGameActivated: true,
    startTimeEastern: '8:00 PM ET',
    startTimeUTC: '2019-10-01T00:00:00.000Z',
    clock: '01:00',
    gameDuration: {
      hours: '',
      minutes: ''
    },
    period: {
      current: 1,
      type: 0,
      maxRegular: 4,
      isHalftime: false,
      isEndOfPeriod: false
    },
    vTeam: {
      teamId: '12329',
      triCode: 'SDS',
      win: '0',
      loss: '0',
      seriesWin: '',
      seriesLoss: '',
      score: '',
      linescore: []
    },
    hTeam: {
      teamId: '1610612745',
      triCode: 'HOU',
      win: '0',
      loss: '0',
      seriesWin: '',
      seriesLoss: '',
      score: '',
      linescore: []
    }
  }
];

function runGameTimeTestService() {
  let collection = db.collection('playbyplay').get();

  collection.then(querySnapshot => {
    querySnapshot.docs.forEach(doc => {
      db.collection('playbyplay')
        .doc(doc.id)
        .delete();
    });
    let testNbaDoc = db.collection('playbyplay').doc('nba');
    testNbaDoc.set({ todaysGames: testGameData });
    let testGameDoc = db.collection('playbyplay').doc('game-0011900001');

    let counter = 0;

    let testPlays = [];

    let testGameTimeSchedule = schedule.scheduleJob(
      { rule: '*/3 * * * * *' },
      () => {
        let play = {
          clock: `00:0${counter}`,
          description: `Event number ${counter}`,
          person_id: '',
          event: `${counter}`
        };

        testPlays.push(play);

        testGameDoc.set(
          {
            plays: testPlays
          },
          { merge: true }
        );
        console.log(`Event ${counter} pushed.`);

        counter++;
      }
    );
  });
}

runGameTimeTestService();
