import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type QuoteId = bigint;
export type Time = bigint;
export interface Quote {
    itemsSummary: string;
    clientName: string;
    totalCents: bigint;
    timestamp: Time;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteQuote(quoteId: QuoteId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllQuotes(): Promise<Array<[QuoteId, Quote]>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveQuote(clientName: string, itemsSummary: string, totalCents: bigint): Promise<QuoteId>;
}
