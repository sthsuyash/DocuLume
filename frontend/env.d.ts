// Add your frontend environment variable typings here.
// Do NOT edit next-env.d.ts (it's auto-generated).
// Replace or add keys below with your actual environment variable names.

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            NEXT_PUBLIC_API_URL?: string;
            NEXT_PUBLIC_OAUTH_REDIRECT_URI?: string;
            NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
            NEXT_PUBLIC_GITHUB_CLIENT_ID?: string;
            NEXT_PUBLIC_ANALYTICS_ID?: string;
            // Add other `NEXT_PUBLIC_...` keys your app uses, e.g.:
            // NEXT_PUBLIC_SOME_FEATURE_FLAG?: 'true' | 'false';
        }
    }
}

export { };
