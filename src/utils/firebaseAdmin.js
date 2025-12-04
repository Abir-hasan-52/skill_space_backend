const admin = require("firebase-admin");

const serviceAccount = require("./skill-space-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
