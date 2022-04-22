/** @format */

var admin = require('firebase-admin');

var serviceAccount = require('./firebaseConfig/leaguequizes-firebase-adminsdk-ulkvh-3aface7005.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();
const getLastChampionName = async () => {
  let response = await firestore.collection('championsData').get();

  return response.docs.length == 0
    ? null
    : response.docs[response.docs.length - 1].id;
};
exports.fireStore = firestore;
exports.getLastChampionName = getLastChampionName();
