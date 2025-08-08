import { type ActionFunctionArgs, data } from "react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseMarkdownToJson, parseTripData } from "~/lib/utils";
import { appwriteConfig, database } from "~/appwrite/client";
import { ID } from "appwrite";
import { createProduct } from "~/lib/stripe";

interface Trip {
    name: string;
    description: string;
    estimatedPrice: string; // e.g. "$1000"
    duration: number;
    budget: string;
    travelStyle: string;
    country: string;
    interests: string | string[];
    groupType: string;
    bestTimeToVisit: string[];
    weatherInfo: string[];
    location: {
        city: string;
        coordinates: [number, number];
        openStreetMap: string;
    };
    itinerary: {
        day: number;
        location: string;
        activities: { time: string; description: string }[];
    }[];
}

function isTrip(obj: any): obj is Trip {
    return (
        obj &&
        typeof obj === "object" &&
        typeof obj.name === "string" &&
        typeof obj.description === "string" &&
        typeof obj.estimatedPrice === "string" &&
        typeof obj.duration === "number" &&
        typeof obj.budget === "string" &&
        typeof obj.travelStyle === "string" &&
        typeof obj.country === "string" &&
        (typeof obj.interests === "string" || Array.isArray(obj.interests)) &&
        typeof obj.groupType === "string" &&
        Array.isArray(obj.bestTimeToVisit) &&
        Array.isArray(obj.weatherInfo) &&
        obj.location &&
        typeof obj.location.city === "string" &&
        Array.isArray(obj.location.coordinates) &&
        obj.location.coordinates.length === 2 &&
        typeof obj.location.coordinates[0] === "number" &&
        typeof obj.location.coordinates[1] === "number" &&
        typeof obj.location.openStreetMap === "string" &&
        Array.isArray(obj.itinerary) &&
        obj.itinerary.every(
            (day: any) =>
                typeof day.day === "number" &&
                typeof day.location === "string" &&
                Array.isArray(day.activities) &&
                day.activities.every(
                    (act: any) =>
                        typeof act.time === "string" && typeof act.description === "string"
                )
        )
    );
}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const {
            country,
            numberOfDays,
            travelStyle,
            interests,
            budget,
            groupType,
            userId,
        } = await request.json();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY!;

        const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
Budget: '${budget}'
Interests: '${interests}'
TravelStyle: '${travelStyle}'
GroupType: '${groupType}'
Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
{
  "name": "A descriptive title for the trip",
  "description": "A brief description of the trip and its highlights not exceeding 100 words",
  "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
  "duration": ${numberOfDays},
  "budget": "${budget}",
  "travelStyle": "${travelStyle}",
  "country": "${country}",
  "interests": ${JSON.stringify(interests)},
  "groupType": "${groupType}",
  "bestTimeToVisit": [
    "🌸 Season (from month to month): reason to visit",
    "☀️ Season (from month to month): reason to visit",
    "🍁 Season (from month to month): reason to visit",
    "❄️ Season (from month to month): reason to visit"
  ],
  "weatherInfo": [
    "☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)"
  ],
  "location": {
    "city": "name of the city or region",
    "coordinates": [latitude, longitude],
    "openStreetMap": "link to open street map"
  },
  "itinerary": [
    {
      "day": 1,
      "location": "City/Region Name",
      "activities": [
        {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
        {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
        {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
      ]
    }
    // ...more days
  ]
}`;

        const genModel = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const textResult = await genModel.generateContent([prompt]);

        // Parse the AI response text to JSON
        const tripRaw = parseMarkdownToJson(textResult.response.text());

        if (!isTrip(tripRaw)) {
            throw new Error("Invalid trip data structure returned from AI");
        }

        // Fetch images from Unsplash
        const imageResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
                country + " " + interests + " " + travelStyle
            )}&client_id=${unsplashApiKey}`
        );
        const imageData = await imageResponse.json();

        const imageUrls = (imageData.results || [])
            .slice(0, 3)
            .map((result: any) => result.urls?.regular || null)
            .filter(Boolean);

        // Save trip data to database
        const result = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripCollectionId,
            ID.unique(),
            {
                tripDetails: JSON.stringify(tripRaw),
                createdAt: new Date().toISOString(),
                imageUrls,
                userId,
            }
        );

        // tripRaw is validated Trip
        const tripDetail = tripRaw;

        // Extract numeric price from string like "$1000"
        const tripPrice = parseInt(tripDetail.estimatedPrice.replace(/\$/g, ""), 10);

        // Create Stripe product/payment link
        const paymentLink = await createProduct(
            tripDetail.name,
            tripDetail.description,
            imageUrls,
            tripPrice,
            result.$id
        );

        // Update trip document with payment link
        await database.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripCollectionId,
            result.$id,
            {
                payment_link: paymentLink.url,
            }
        );

        return data({ id: result.$id });
    } catch (e) {
        console.error("Error generating travel plan: ", e);
        return data({ error: "Failed to generate travel plan" });
    }
};
