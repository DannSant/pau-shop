import { useLocation } from "react-router-dom";

// Shows where the app navigated to (any route other than the one under test).
export default function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}
