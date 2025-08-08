import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { getAllTrips, getTripById } from "~/appwrite/trips";

import { cn, getFirstWord, parseTripData } from "~/lib/utils";
import { Header, TripCard } from "../../../components";
// @ts-ignore
import InfoPill from "../../../components/InfoPill";

import { ChipDirective, ChipListComponent, ChipsDirective } from "@syncfusion/ej2-react-buttons";

interface DayPlan {
    day: number;
    location: string;
    activities: { time: string; description: string }[];
}

interface Trip {
    id: string;
    name: string;
    duration: number;
    itinerary: DayPlan[];
    travelStyle: string;
    groupType: string;
    budget: string;
    interests: string;
    estimatedPrice: string;  // always string
    description: string;
    bestTimeToVisit: string[];
    weatherInfo: string[];
    country: string;
    imageUrls: string[];
}

// Helper to safely parse tripDetails (which can be string or object)
function safeParseTripDetails(tripDetails: unknown): Partial<Trip> {
    if (!tripDetails) return {};
    if (typeof tripDetails === "object") {
        // @ts-ignore
        return parseTripData(JSON.stringify(tripDetails)) || {};
    }
    if (typeof tripDetails === "string") {
        // @ts-ignore
        return parseTripData(tripDetails) || {};
    }
    return {};
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
    const { tripId } = params;
    if (!tripId) throw new Error("Trip ID is required");

    const [trip, trips] = await Promise.all([getTripById(tripId), getAllTrips(4, 0)]);

    if (!trip) throw new Error("Trip not found");

    const parsedTripDetails = safeParseTripDetails(trip.tripDetails);

    const allTrips = trips.allTrips.map((item: any) => {
        const details = safeParseTripDetails(item.tripDetails);

        return {
            id: item.$id,
            name: details.name ?? "",
            duration: details.duration ?? 0,
            itinerary: details.itinerary ?? [],
            travelStyle: details.travelStyle ?? "",
            groupType: details.groupType ?? "",
            budget: details.budget ?? "",
            interests: details.interests ?? "",
            estimatedPrice:
                details.estimatedPrice !== undefined
                    ? String(details.estimatedPrice)
                    : "",
            description: details.description ?? "",
            bestTimeToVisit: details.bestTimeToVisit ?? [],
            weatherInfo: details.weatherInfo ?? [],
            country: details.country ?? "",
            imageUrls: item.imageUrls ?? [],
        };
    });

    return {
        trip: {
            ...trip,
            ...parsedTripDetails,
        },
        allTrips,
    };
};

const TripDetail = ({
                        loaderData,
                    }: {
    loaderData: Awaited<ReturnType<typeof loader>>;
}) => {
    const trip = loaderData.trip;
    if (!trip) {
        return <p>Trip not found.</p>;
    }

    const {
        name,
        duration,
        itinerary,
        travelStyle,
        groupType,
        budget,
        interests,
        estimatedPrice,
        description,
        bestTimeToVisit,
        weatherInfo,
        country,
        imageUrls = [],
    } = trip;

    const allTrips = loaderData.allTrips as Trip[];

    const pillItems = [
        { text: travelStyle, bg: "!bg-pink-50 !text-pink-500" },
        { text: groupType, bg: "!bg-primary-50 !text-primary-500" },
        { text: budget, bg: "!bg-success-50 !text-success-700" },
        { text: interests, bg: "!bg-navy-50 !text-navy-500" },
    ].filter((pill) => pill.text);

    const visitTimeAndWeatherInfo: { title: string; items?: string[] }[] = [
        { title: "Best Time to Visit:", items: bestTimeToVisit },
        { title: "Weather:", items: weatherInfo },
    ];

    return (
        <main className="travel-detail wrapper">
            <Header title="Trip Details" description="View and edit AI-generated travel plans" />

            <section className="container wrapper-md">
                <header>
                    <h1 className="p-40-semibold text-dark-100">{name}</h1>
                    <div className="flex items-center gap-5">
                        {duration && <InfoPill text={`${duration} day plan`} image="/assets/icons/calendar.svg" />}
                        {itinerary && itinerary.length > 0 && (
                            <InfoPill
                                text={itinerary.slice(0, 4).map((item) => item.location).join(", ")}
                                image="/assets/icons/location-mark.svg"
                            />
                        )}
                    </div>
                </header>

                <section className="gallery">
                    {imageUrls.map((url: string, i: number) => (
                        <img
                            src={url}
                            key={i}
                            className={cn(
                                "w-full rounded-xl object-cover",
                                i === 0
                                    ? "md:col-span-2 md:row-span-2 h-[330px]"
                                    : "md:row-span-1 h-[150px]"
                            )}
                            alt={`Trip image ${i + 1}`}
                        />
                    ))}
                </section>

                <section className="flex gap-3 md:gap-5 items-center flex-wrap">
                    <ChipListComponent id="travel-chip">
                        <ChipsDirective>
                            {pillItems.map((pill, i) => (
                                <ChipDirective
                                    key={i}
                                    text={getFirstWord(pill.text)}
                                    cssClass={`${pill.bg} !text-base !font-medium !px-4`}
                                />
                            ))}
                        </ChipsDirective>
                    </ChipListComponent>

                    <ul className="flex gap-1 items-center">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <li key={index}>
                                <img src="/assets/icons/star.svg" alt="star" className="size-[18px]" />
                            </li>
                        ))}
                        <li className="ml-1">
                            <ChipListComponent>
                                <ChipsDirective>
                                    <ChipDirective text="4.9/5" cssClass="!bg-yellow-50 !text-yellow-700" />
                                </ChipsDirective>
                            </ChipListComponent>
                        </li>
                    </ul>
                </section>

                <section className="title">
                    <article>
                        <h3>
                            {duration}-Day {country} {travelStyle} Trip
                        </h3>
                        <p>
                            {budget}, {groupType} and {interests}
                        </p>
                    </article>
                    <h2>{estimatedPrice}</h2>
                </section>

                {description && (
                    <p className="text-sm md:text-lg font-normal text-dark-400">{description}</p>
                )}

                {itinerary && (
                    <ul className="itinerary">
                        {itinerary.map((dayPlan: DayPlan, index: number) => (
                            <li key={index}>
                                <h3>
                                    Day {dayPlan.day}: {dayPlan.location}
                                </h3>
                                <ul>
                                    {dayPlan.activities.map(
                                        (activity: { time: string; description: string }, idx: number) => (
                                            <li key={idx}>
                                                <span className="flex-shrink-0 p-18-semibold">{activity.time}</span>
                                                <p className="flex-grow">{activity.description}</p>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}

                {visitTimeAndWeatherInfo.map(
                    (section: { title: string; items?: string[] }, idx: number) =>
                        section.items && (
                            <section key={section.title} className="visit">
                                <div>
                                    <h3>{section.title}</h3>
                                    <ul>
                                        {section.items.map((item: string, idx: number) => (
                                            <li key={idx}>
                                                <p className="flex-grow">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )
                )}
            </section>

            <section className="flex flex-col gap-6">
                <h2 className="p-24-semibold text-dark-100">Popular Trips</h2>
                <div className="trip-grid">
                    {allTrips.map((trip: Trip) => (
                        <TripCard
                            key={trip.id}
                            id={trip.id}
                            name={trip.name}
                            imageUrl={trip.imageUrls[0]}
                            location={trip.itinerary?.[0]?.location ?? ""}
                            tags={[trip.interests, trip.travelStyle]}
                            price={trip.estimatedPrice}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
};

export default TripDetail;
