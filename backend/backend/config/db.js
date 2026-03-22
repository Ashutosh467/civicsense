import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseKey;

if (process.env.FIREBASE_KEY) {
  // Production (Render)
  firebaseKey = JSON.parse(process.env.FIREBASE_KEY);
  console.log("🔥 Using FIREBASE_KEY from environment");
} else {
  // Local development
  const keyPath = path.join(__dirname, "firebaseKey.json");

  if (!fs.existsSync(keyPath)) {
    throw new Error("firebaseKey.json not found in config folder");
  }

  firebaseKey = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  console.log("🔥 Using firebaseKey.json for local development");
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseKey),
});

const db = admin.firestore();

console.log("✅ Firebase Firestore Connected");

export default db;
