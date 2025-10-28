"use client";
import React from 'react'
import ForgetPass from '@/Components/LoginComponts/Forget-Pass'
import { InvisiblePreloader } from '@/Components/Helper/InvisibleSpeedBoost'

const ForgetPassPage = () => {
  return (
    <>
      {/* ✅ FIX: Only preload unauthenticated routes */}
      <InvisiblePreloader routes={['/', '/signup']} />
      <ForgetPass />
    </>
  )
}

export default ForgetPassPage
