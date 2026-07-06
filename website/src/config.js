// In dev, leave this empty so requests stay relative and go through the Vite proxy
// (see vite.config.js) to the local backend. In production there's no proxy, so the
// build uses the live API host instead — see .env.production.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
