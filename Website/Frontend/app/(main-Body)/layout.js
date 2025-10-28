'use client';

import ProtectedRoute from "../../Components/Helper/ProtectedRoute";
import MainLayout from "../../Components/Layout/MainLayout";

export default function MainBodyLayout({ children }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}
