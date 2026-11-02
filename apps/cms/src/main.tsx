import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfirmHost } from "./components/ui/Modal";
import { Toaster } from "./components/ui/Toast";
import { AdminLayout } from "./layouts/AdminLayout";
import { AuthProvider, useAuth } from "./lib/auth";
import { CustomerDetailPage, CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PostFormPage } from "./pages/PostFormPage";
import { PostsPage } from "./pages/PostsPage";
import { ProductFormPage } from "./pages/ProductFormPage";
import { ProductsPage } from "./pages/ProductsPage";
import { TaxonomyPage } from "./pages/TaxonomyPage";
import "./index.css";

function App() {
  const { signedIn } = useAuth();
  if (!signedIn) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />
        <Route path="categories" element={<TaxonomyPage kind="categories" />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/new" element={<PostFormPage />} />
        <Route path="posts/:id" element={<PostFormPage />} />
        <Route path="post-categories" element={<TaxonomyPage kind="post-categories" />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ConfirmHost />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
