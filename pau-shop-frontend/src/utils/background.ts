export const getBackgroundStyle = () => {
  console.log(import.meta.env.VITE_APP_BACKGROUND_IMAGE);
  const bg = import.meta.env.VITE_APP_BACKGROUND_IMAGE || "./assets/bg.jpg";

  if (!bg) return {};

  return {
    backgroundImage: `url(./assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    
  };
};
