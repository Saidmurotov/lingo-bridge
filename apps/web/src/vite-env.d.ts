/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Lingo Bridge API. Defaults to '/api' (dev proxy / same-origin). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
