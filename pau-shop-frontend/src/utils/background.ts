// Absolute path, so pages like /orders/123 don't look for /orders/assets/...
const BACKGROUND_IMAGE = import.meta.env.VITE_APP_BACKGROUND_IMAGE || "/assets/bg.jpg";

export const getBackgroundStyle = () => ({
  backgroundImage: `url(${BACKGROUND_IMAGE})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
});
