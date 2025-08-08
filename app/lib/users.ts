import { database, account } from "~/appwrite/client";
import type { Models } from "appwrite";

const DATABASE_ID = "your_database_id";
const USERS_COLLECTION_ID = "your_users_collection_id";

export interface UserDocument extends Models.Document {
    name: string;
    email: string;
    status: "user" | "admin";
    dateJoined: string;
    imageUrl: string;
    itineraryCreated: number;
}

export async function getExistingUser(userId: string): Promise<UserDocument | null> {
    try {
        const result = await database.getDocument<UserDocument>(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            userId
        );
        return result;
    } catch (error: any) {
        if (error?.code === 404) return null;
        console.error("Error fetching existing user:", error);
        throw error;
    }
}

export async function storeUserData(): Promise<UserDocument> {
    try {
        const user = await account.get();
        if (!user?.$id) throw new Error("No logged-in user found");

        const newUserData: Omit<UserDocument, keyof Models.Document> = {
            name: user.name || "",
            email: user.email || "",
            status: "admin",
            dateJoined: new Date().toISOString(),
            imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}`,
            itineraryCreated: 0
        };

        return await database.createDocument<UserDocument>(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.$id,
            newUserData
        );
    } catch (error) {
        console.error("Error storing new user:", error);
        throw error;
    }
}

