// Main trip form type
export interface TripFormData {
    country: string;
    travelStyle: string;
    interest: string;
    budget: string;
    duration: number;
    groupType: string;
}

// Extract keys for dropdowns (exclude country + duration)
export type DropdownKeys = Exclude<keyof TripFormData, "country" | "duration">;
