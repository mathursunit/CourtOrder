import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../courtorder-ef262-firebase-adminsdk-fbsvc-80918e7fd5.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deployRules() {
  const rulesPath = path.join(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  console.log('Deploying Firestore Rules...');
  
  try {
    const rulesSource = {
      files: [
        {
          name: 'firestore.rules',
          content: rulesContent,
        },
      ],
    };

    const ruleset = await admin.securityRules().createRuleset(rulesSource);
    console.log(`Created ruleset: ${ruleset.name}`);

    await admin.securityRules().releaseFirestoreRuleset(ruleset.name);
    console.log('Successfully released Firestore ruleset!');
  } catch (error) {
    console.error('Error deploying rules:', error);
    process.exit(1);
  }
}

deployRules();
