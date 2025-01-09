/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AWS_REGION: string
    readonly VITE_AWS_ACCESS_KEY_ID: string
    readonly VITE_AWS_SECRET_ACCESS_KEY: string
    readonly VITE_IAC_TEMPLATE_S3_BUCKET: string
    readonly VITE_WA_DOCS_S3_BUCKET: string
    readonly VITE_KNOWLEDGE_BASE_ID: string
    readonly VITE_MODEL_ID: string
    readonly VITE_DEFAULT_REVIEWER: string
    readonly VITE_DEFAULT_ENVIRONMENT: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }