export const getBackgroundStyle = () => {
  const bg = import.meta.env.VITE_APP_BACKGROUND_IMAGE;

  if (!bg) return {};

  return {
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed"
  };
};
