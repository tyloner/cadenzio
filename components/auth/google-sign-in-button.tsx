"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56C11.243 14.1 10.211 14.42 9 14.42c-2.392 0-4.415-1.615-5.138-3.787H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.862 10.633A5.4 5.4 0 0 1 3.58 9c0-.566.098-1.115.282-1.633V5.035H.957A9.003 9.003 0 0 0 0 9c0 1.452.348 2.827.957 4.035l2.905-2.402z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 5.035L3.862 7.367C4.585 5.195 6.608 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)

  return (
    <button
      onClick={async () => {
        setLoading(true)
        await signIn("google", { callbackUrl: "/dashboard" })
      }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 px-4 text-sm font-medium text-ink hover:bg-mist transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <GoogleIcon />
      )}
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  )
}
