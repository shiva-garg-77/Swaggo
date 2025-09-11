"use client";

import { AuthContext } from "../Components/Helper/AuthProvider";
import Login from "../Components/LoginComponts/Login";
import { PerformanceDebugger } from "../Components/Helper/PerformanceMonitor";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

export default function Home() {
  const { accessToken, initialized } = useContext(AuthContext);
  const router = useRouter();

  // Redirect if already logged in (only after initialization)
  useEffect(() => {
    if (initialized && accessToken) {
      router.push("/home");
    }
  }, [initialized, accessToken, router]);

  // Show nothing until initialized
  if (!initialized) {
    return null;
  }

  return (
    <>
      <PerformanceDebugger enabled={process.env.NODE_ENV === 'development'} />
      <main>
        <Login />
      </main>
    </>
  );
}
