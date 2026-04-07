/**
 * Barrel re-export — keeps all existing import paths working.
 * Each domain has its own file under src/lib/api/:
 *
 *   auth.api.ts       → auth types and login/me functions
 *   categories.api.ts → Category type and category functions
 *   products.api.ts   → Product types and CRUD functions
 *   inventory.api.ts  → Stock/Movement types and inventory functions
 *   sales.api.ts      → Sale types and POS functions
 */
export * from './api/auth.api';
export * from './api/categories.api';
export * from './api/products.api';
export * from './api/inventory.api';
export * from './api/sales.api';
