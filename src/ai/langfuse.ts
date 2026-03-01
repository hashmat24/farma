
import { Langfuse } from 'langfuse';

/**
 * Initializes the Langfuse SDK for mandatory project observability.
 * Uses environment variables for clinical data security.
 */
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || 'pk-lf-demo',
  secretKey: process.env.LANGFUSE_SECRET_KEY || 'sk-lf-demo',
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
});

/**
 * Utility to generate a public trace URL for judges.
 */
export function getTraceUrl(traceId: string) {
  const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
  // Note: Replace 'demo' with actual project slug if known
  return `${host}/project/demo/traces/${traceId}`;
}
