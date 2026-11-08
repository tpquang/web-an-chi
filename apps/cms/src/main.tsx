import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfirmHost } from "./components/ui/Modal";
import { Toaster } from "./components/ui/Toast";
import { AdminLayout } from "./layouts/AdminLayout";
import { AuthProvider, useAuth } from "./lib/auth";
import { BatchesPage } from "./pages/BatchesPage";
import { BeadTexturesPage } from "./pages/BeadTexturesPage";
import { BatchFormPage } from "./pages/BatchFormPage";
import { CustomerDetailPage, CustomersPage } from "./pages/CustomersPage";
import { InboxPage } from "./pages/InboxPage";
import { StaffPage } from "./pages/StaffPage";
import { StorePage } from "./pages/StorePage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { MovementsPage } from "./pages/MovementsPage";
import { PackingPage } from "./pages/PackingPage";
import { DashboardPage, ReportsPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { OrderCreatePage } from "./pages/OrderCreatePage";
import { StocktakePage } from "./pages/StocktakePage";
import { LoginPage } from "./pages/LoginPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PostFormPage } from "./pages/PostFormPage";
import { HomeConfigPage } from "./pages/HomeConfigPage";
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
        <Route path="inbox" element={<InboxPage />} />
        <Route path="inbox/:id" element={<InboxPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id" element={<ProductFormPage />} />
        <Route path="categories" element={<TaxonomyPage kind="categories" />} />
        <Route path="bead-textures" element={<BeadTexturesPage />} />
        <Route path="home" element={<HomeConfigPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/new" element={<PostFormPage />} />
        <Route path="posts/:id" element={<PostFormPage />} />
        <Route path="post-categories" element={<TaxonomyPage kind="post-categories" />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<OrderCreatePage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="business" element={<BatchesPage />} />
        <Route path="business/new" element={<BatchFormPage />} />
        <Route path="business/:id" element={<BatchFormPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="packing" element={<PackingPage />} />
        <Route path="stock" element={<MovementsPage />} />
        <Route path="stocktake" element={<StocktakePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
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
