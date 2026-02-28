'use client';

/**
 * Barrel file for Firebase functionality.
 * Note: Core initialization is moved to ./app.ts to prevent circular dependency issues
 * with the client-provider.
 */

export * from './app';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
