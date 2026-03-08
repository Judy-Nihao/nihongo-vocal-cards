/// <reference types="vite/client" />

/**
 * Define the types for all environment variables
 * This allows TypeScript to recognize all variables in import.meta.env
 */
interface ImportMetaEnv {
  // Base URL for the API server (used to call backend API endpoints)
  // Development default: /api
  // Production: can be set to Vercel domain
  readonly VITE_API_BASE_URL?: string;
}

/**
 * Extend TypeScript's ImportMeta interface
 * Define the type of import.meta.env as ImportMetaEnv above
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
