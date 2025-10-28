"use client";
import Resetpass from "@/Components/LoginComponts/Reset-Pass";
import { useParams } from "next/navigation";

export default function ResetPassPage() {
  const params = useParams();
  // Safely extract token to avoid read-only property issues
  const token = params?.token ? String(params.token) : undefined;
  return (
    <main>
      <Resetpass token={token} />
    </main>
  );
}

