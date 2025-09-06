"use client";

import Login from "../Components/LoginComponts/Login";
import { AuthContext } from "../Components/Helper/AuthProvider";
import SplashScreen from "../Components/Helper/SplashScreen";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

export default function Home() {
  const { accessToken, loading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && accessToken) {
      router.push("/home");
    }
  }, [loading, accessToken, router]);

  if (loading) return <SplashScreen />;

  return (
    <main>
      <Login />
    </main>
  );
}
