// Admin frontend environment variable typings.
// Add keys your admin frontend uses. Do NOT edit next-env.d.ts.

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            NEXT_PUBLIC_API_URL?: string;
        }
    }
}

export { };
