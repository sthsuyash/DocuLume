// Landing app environment variable typings.
// Add keys used by the landing site. Do NOT edit next-env.d.ts.

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            NEXT_PUBLIC_FE_URL?: string;
            NEXT_PUBLIC_ZENSICAL_API_URL?: string;
            NEXT_PUBLIC_SUPPORT_EMAIL?: string;
            NEXT_PUBLIC_SALES_EMAIL?: string;
            NEXT_PUBLIC_SECURITY_EMAIL?: string;
            BREVO_API_KEY?: string;
            BREVO_LIST_ID?: string;
            NEWSLETTER_WEBHOOK_URL?: string;
        }
    }
}

export { };
