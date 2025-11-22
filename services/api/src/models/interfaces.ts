// Common interfaces to break dependency cycles

export interface IUser {
  id: number;
  name: string;
  email: string;
}

export interface ICoachProfile {
  id: number;
  userId: number;
  displayName: string;
}

export interface ICoachPackage {
  id: number;
  coachProfileId: number;
}

export interface ICoachSession {
  id: number;
  coachProfileId: number;
}

export interface ICoachReview {
  id: number;
  coachProfileId: number;
}

export interface IContent {
  id: number;
  title: string;
}