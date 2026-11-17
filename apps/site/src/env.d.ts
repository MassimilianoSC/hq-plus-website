/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PUBLIC_RECAPTCHA_SITE_KEY?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SUBMIT_LEAD_URL?: string;
  readonly PUBLIC_EXTRACT_URL?: string;
  readonly PUBLIC_SUGGEST_URL?: string;
  readonly PUBLIC_DEMO_LEAD_URL?: string;
  readonly PUBLIC_ALLOW_INDEXING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
