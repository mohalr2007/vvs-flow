export type OwnerSession = {
  authenticated: boolean;
  mode: "frontend-demo";
  owner: { name: string; initials: string; business: string };
};

export interface OwnerAuthService {
  getSession(): OwnerSession;
}

export const ownerAuthService: OwnerAuthService = {
  getSession: () => ({
    authenticated: true,
    mode: "frontend-demo",
    owner: { name: "Mats Ekström", initials: "ME", business: "Ekström VVS" },
  }),
};