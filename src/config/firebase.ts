import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from "firebase/firestore"

// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Acesse o Firebase Console (https://console.firebase.google.com)
// 2. Crie um novo projeto ou use um existente
// 3. Vá em "Project Settings" > "General" > "Your apps"
// 4. Clique em "Add app" e selecione "Web"
// 5. Copie as configurações e substitua os valores abaixo

const firebaseConfig = {
	apiKey: import.meta.env.VITE_API_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_API_FIREBASE_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_API_FIREBASE_DATABASE_URL,
	projectId: import.meta.env.VITE_API_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_API_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_API_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_API_FIREBASE_APP_ID,

};

// ATENÇÃO: Para usar o Firebase em produção, você deve:
// 1. Substituir as configurações acima pelas suas credenciais reais
// 2. Habilitar Realtime Database no Firebase Console
// 3. Configurar as regras de segurança do database
// 4. Habilitar Authentication se necessário

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