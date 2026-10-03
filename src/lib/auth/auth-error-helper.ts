/**
 * Sanitizes technical authentication and database errors into clean,
 * friendly, user-facing error messages for the WeAre platform.
 * Never exposes raw SQL, Supabase, or internal server errors to users.
 */
export function sanitizeAuthError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again.";

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid grant") ||
    lower.includes("invalid_credentials") ||
    lower.includes("user not found") ||
    lower.includes("wrong password")
  ) {
    return "Email or password is incorrect.";
  }

  if (
    lower.includes("email not confirmed") ||
    lower.includes("not confirmed") ||
    lower.includes("unconfirmed")
  ) {
    return "Please verify your email before signing in.";
  }

  if (
    lower.includes("already registered") ||
    lower.includes("user already exists") ||
    lower.includes("unique violation")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Too many requests. Please wait a few moments before trying again.";
  }

  if (
    lower.includes("password should be at least") ||
    lower.includes("weak password") ||
    lower.includes("password is too short")
  ) {
    return "Password must be at least 8 characters long.";
  }

  if (
    lower.includes("valid email") ||
    lower.includes("invalid email") ||
    lower.includes("email_address_invalid")
  ) {
    return "Please enter a valid email address.";
  }

  if (
    lower.includes("jwt expired") ||
    lower.includes("token expired") ||
    lower.includes("otp expired") ||
    lower.includes("flow state not found")
  ) {
    return "Your session or reset link has expired. Please request a new one.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("connection")
  ) {
    return "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

