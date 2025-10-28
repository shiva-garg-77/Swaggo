"use client";
import Signup from "@/Components/LoginComponts/Signup";
import { InvisiblePreloader } from '@/Components/Helper/InvisibleSpeedBoost';

export default function SignupPage() {
  return (
    <>
      {/* ✅ FIX: Only preload unauthenticated routes */}
      <InvisiblePreloader routes={['/', '/forget-password']} />
      <main>
        <Signup />
      </main>
    </>
  );
}

