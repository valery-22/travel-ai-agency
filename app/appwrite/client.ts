import { Account, Client, Databases, Storage } from "appwrite";

export const appwriteConfig = {
    endpointUrl: import.meta.env.VITE_APPWRITE_API_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    userCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    tripCollectionId: import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID,
};

// Debug log - shows all env variables on startup
console.log("🔍 Appwrite Config:");
Object.entries(appwriteConfig).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ?? "❌ MISSING"}`);
});

// Stop if required variables are missing
if (!appwriteConfig.endpointUrl || !appwriteConfig.projectId) {
    throw new Error(
        `❌ Missing required Appwrite config. 
        endpointUrl: ${appwriteConfig.endpointUrl}
        projectId: ${appwriteConfig.projectId}
        
        Make sure these are set in your .env file:
        VITE_APPWRITE_API_ENDPOINT=...
        VITE_APPWRITE_PROJECT_ID=...
        `
    );
}

const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage };
