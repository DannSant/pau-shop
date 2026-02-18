import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { getBackgroundStyle } from "../../utils/background";

export default function MainLayout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={getBackgroundStyle()}
    >
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
