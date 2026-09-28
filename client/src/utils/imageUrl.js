const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export const getImageUrl = (path) => (path ? `${API_ORIGIN}${path}` : null);