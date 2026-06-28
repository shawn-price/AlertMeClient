export function ensureVartechConfig(): void {
  const required = ["VARTECH_API_KEY", "VARTECH_BASE_URL"]

  const missing = required.filter((k) => !process.env[k])

  if (missing.length > 0) {
    console.warn(`VarTech configuration missing environment variables: ${missing.join(", ")}`)
  }
}

export function ensureEnvVar(name: string): void {
  if (!process.env[name]) {
    console.warn(`Environment variable ${name} is not set`)
  }
}
