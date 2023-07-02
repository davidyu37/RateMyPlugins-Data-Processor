import admin from 'firebase-admin';
import fs from 'fs/promises';
import serviceAccount from './firebase-adminsdk.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadPlugins() {
    try {
        const jsonString = await fs.readFile('./output/newDocuments.json', 'utf-8');
        const dataArray = JSON.parse(jsonString);

        for (let data of dataArray) {
            const docRef = db.collection('plugins').doc(); // Create a new document reference with a randomly generated id.
            await docRef.set(data);
        }
        
        console.log('Data uploaded successfully.');
    } catch (error) {
        console.error('Error uploading data:', error);
    }
}

async function uploadCategories() {
    try {
        const jsonString = await fs.readFile('./output/categories.json', 'utf-8');
        const dataArray = JSON.parse(jsonString);

        
        
        for (let data of dataArray) {
            const docRef = db.collection('categories').doc();
            await docRef.set(data);
        }
        
        console.log('Data uploaded successfully.');
    } catch (error) {
        console.error('Error uploading data:', error);
    }
}

uploadPlugins();
uploadCategories();
