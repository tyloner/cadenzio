import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export const metadata = { title: "Sign in" }

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        "Could not start Google sign-in. Check your Client ID.",
  OAuthCallback:      "Google returned an error. Check your redirect URI.",
  OAuthCreateAccount: "Could not create account. Check database connection.",
  Callback:           "Sign-in callback failed.",
  OAuthAccountNotLinked: "Email already used with a different provider.",
  AccessDenied:       "Access denied. If you set the Google app to 'Testing', add your email as a test user in Google Console → OAuth consent screen → Test users.",
  default:            "Something went wrong. Try again.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect("/dashboard")

  const { error } = await searchParams
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default) : null
  const isDev = process.env.NODE_ENV === "development"

  return (
    <main className="min-h-screen bg-mist flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Image src="/assets/logo.svg" alt="Cadenz.io" width={130} height={36} priority />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h1 className="text-xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-8">Sign in to continue composing.</p>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              <strong>Error:</strong> {errorMsg}
              {error && <span className="block text-xs text-red-400 mt-0.5">Code: {error}</span>}
            </div>
          )}

          {isDev && (
            <form
              action={async () => {
                "use server"
                await signIn("dev-login", { redirectTo: "/dashboard" })
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-ink text-white rounded-xl py-3 px-4 text-sm font-medium mb-4 hover:bg-slate transition-colors"
              >
                <span className="text-xs bg-beat text-white px-1.5 py-0.5 rounded font-mono">DEV</span>
                Skip login (dev only)
              </button>
            </form>
          )}

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 px-4 text-sm font-medium text-ink hover:bg-mist transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <div className="mt-3 flex items-center gap-3 border border-border rounded-xl py-3 px-4 opacity-40 cursor-not-allowed select-none">
            <AppleIcon />
            <span className="text-sm font-medium text-ink">Continue with Apple</span>
            <span className="ml-auto text-xs text-muted">Coming soon</span>
          </div>

          <p className="text-xs text-muted text-center mt-8 leading-relaxed">
            By continuing you agree to our{" "}
            <Link href="/legal/terms" className="text-wave hover:underline">Terms</Link>
            {" and "}
            <Link href="/legal/privacy" className="text-wave hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}

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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701z"/>
    </svg>
  )
}
