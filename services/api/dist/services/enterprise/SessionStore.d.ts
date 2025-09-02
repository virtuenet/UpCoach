export interface OIDCSession {
    state: string;
    codeVerifier: string;
    redirectUri: string;
    configId: number;
    createdAt: Date;
}
export declare class SessionStore {
    private readonly prefix;
    private readonly ttl;
    createSession(configId: number, redirectUri: string): Promise<string>;
    getSession(state: string): Promise<OIDCSession | null>;
    deleteSession(state: string): Promise<void>;
    getCodeVerifier(state: string): Promise<string | null>;
}
export declare const sessionStore: SessionStore;
//# sourceMappingURL=SessionStore.d.ts.map