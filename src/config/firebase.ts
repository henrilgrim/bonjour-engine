import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from "firebase/firestore"

const firebaseConfig = {
	apiKey: import.meta.env.VITE_API_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_API_FIREBASE_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_API_FIREBASE_DATABASE_URL,
	projectId: import.meta.env.VITE_API_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_API_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_API_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_API_FIREBASE_APP_ID,

};

let app: FirebaseApp;
let database: Database;
let auth: Auth;
let firestore: Firestore;

try {
	app = initializeApp(firebaseConfig);
	database = getDatabase(app);
	auth = getAuth(app);
	firestore = getFirestore(app);
} catch (error) {
	console.error('Erro ao inicializar Firebase:', error);
	console.log('⚠️  Configure as credenciais do Firebase em src/config/firebase.ts');
}

export { database, auth, firestore };
export default app;