import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountSnapshot = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../courtorder-ef262-firebase-adminsdk-fbsvc-80918e7fd5.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountSnapshot)
});

async function deployRules() {
  const rulesPath = path.join(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  console.log('Deploying Firestore Rules via Admin SDK...');
  
  try {
    const rulesSource = {
      files: [
        {
          name: 'firestore.rules',
          content: rulesContent,
        },
      ],
    };

    // The correct structure for createRuleset is { source: { files: [...] } }
    const ruleset = await admin.securityRules().createRuleset({ source: rulesSource });
    console.log(`Created ruleset: ${ruleset.name}`);

    await admin.securityRules().releaseFirestoreRuleset(ruleset.name);
    console.log('Successfully released Firestore ruleset!');
  } catch (error) {
    console.error('Detailed Error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

deployRules();
