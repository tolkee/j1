/// <reference types="vite/client" />

/**
 * Import all function modules for convex-test
 * This is required because our functions are in src/ instead of the default convex/ location
 */
export const modules = import.meta.glob("../../src/**/!(*.*.*)*.*s");
