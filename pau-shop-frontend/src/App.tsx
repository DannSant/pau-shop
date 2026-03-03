import AppRouter from "./routes/AppRouter";
import { useAppDispatch } from "./hooks/useAppDispatch";
import { fetchProducts } from "./features/products/productsSlice";
import { useEffect } from "react";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);
  return <AppRouter />;
}
