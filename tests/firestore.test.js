const db = require('../services/firebase');

test('The Firestore "playbyplay" collection exists', () => {
  const pbpCollectionId = db.collection('playbyplay').id;
  expect(pbpCollectionId).toBe('playbyplay');
});
