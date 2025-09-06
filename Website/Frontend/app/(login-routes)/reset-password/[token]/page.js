"use client";
import Resetpass from "@/Components/LoginComponts/Reset-Pass";
import { useParams } from "next/navigation";

export default function ResetPassPage() {
  const params = useParams();
  const token = params.token
  return (
    <main>
      <Resetpass token={token} />
    </main>
  );
}

