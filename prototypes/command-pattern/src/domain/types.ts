export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type LearnerId = Brand<string, "LearnerId">;
export type SessionId = Brand<string, "SessionId">;
export type ActivityId = Brand<string, "ActivityId">;
export type ConceptId = Brand<string, "ConceptId">;
export type ClientActionId = Brand<string, "ClientActionId">;
export type AttemptId = Brand<string, "AttemptId">;

export const learnerId = (value: string): LearnerId => value as LearnerId;
export const sessionId = (value: string): SessionId => value as SessionId;
export const activityId = (value: string): ActivityId => value as ActivityId;
export const conceptId = (value: string): ConceptId => value as ConceptId;
export const clientActionId = (value: string): ClientActionId => value as ClientActionId;
