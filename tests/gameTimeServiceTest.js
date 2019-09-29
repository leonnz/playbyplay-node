/**
 *    A test gametime service that pushes test events into the Firestore game doc.
 */

const db = require('../services/firebase');
const schedule = require('node-schedule');

function runGameTimeTestService() {
  let collection = db.collection('playbyplay').get();

  collection.then(querySnapshot => {
    // querySnapshot.docs.forEach(doc => {
    //   db.collection('playbyplay')
    //     .doc(doc.id)
    //     .delete();
    // });
    let testGameDoc = db.collection('playbyplay').doc('game-0011900001');

    let counter = 1;

    let testPlays = [];

    let testGameTimeSchedule = schedule.scheduleJob(
      { rule: '*/3 * * * * *', start: Date.now() + 1 },
      () => {
        let play = {
          clock: `00:0${counter}`,
          description: `Event number ${counter}`,
          person_id: '',
          event: `${counter}`,
          home_score: `${counter + 1}`,
          visitor_score: `${counter + 2}`
        };

        testPlays.push(play);

        testGameDoc.set(
          {
            gameId: '0011900001',
            isGameActivated: true,
            startTimeUTC: '2019-10-01T00:00:00.000Z',
            endTimeUTC: '0',
            period: 1,
            vTeamName: 'SDS',
            vTeamScore: '0',
            hTeamName: 'HOU',
            hTeamScore: '0',
            zPlayByPlay: testPlays
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
