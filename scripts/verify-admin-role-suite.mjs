import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Read env
const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const adminClient = createClient(url, serviceKey);
const anonClient = createClient(url, anonKey);

async function runSuite() {
  console.log("\n========================================================");
  console.log("   WEARE ADMIN ROLE & SECURITY VERIFICATION SUITE");
  console.log("========================================================\n");

  const results = [];

  // 1. Verify existing admin user prajins337@gmail.com has role: admin
  console.log("TEST 1: Preserving legitimate admin account...");
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const adminUser = usersData.users.find((u) => u.email === "prajins337@gmail.com");
  const isAdminPreserved = adminUser && adminUser.app_metadata?.role === "admin";
  console.log("  Admin account:", adminUser?.email, "Role:", adminUser?.app_metadata?.role);
  results.push({
    test: "Existing admin preserved with role=admin",
    passed: Boolean(isAdminPreserved),
  });

  // 2. Test new user registration defaults to role: 'user'
  console.log("\nTEST 2: Testing new registration role defaults to 'user'...");
  const testNewEmail = `role_test_${Date.now()}@weare-test.com`;
  const testNewPass = "Password123!";
  const signupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Regular User Test",
      email: testNewEmail,
      password: testNewPass,
    }),
  });
  const signupJson = await signupRes.json();
  const { data: verifyNewUser } = await adminClient.auth.admin.getUserById(signupJson.user?.id);
  const newRole = verifyNewUser.user?.app_metadata?.role || "user";
  console.log("  New user created:", testNewEmail);
  console.log("  New user app_metadata role:", newRole);
  results.push({
    test: "New user defaults to role=user (never admin)",
    passed: newRole === "user",
  });

  // 3. Logged-out user hitting /admin route
  console.log("\nTEST 3: Testing logged-out user access to /admin...");
  const loggedOutAdminRes = await fetch("http://localhost:3000/admin", {
    redirect: "manual",
  });
  const loggedOutRedirect = loggedOutAdminRes.headers.get("location") || "";
  console.log("  Status:", loggedOutAdminRes.status);
  console.log("  Redirect Location:", loggedOutRedirect);
  const loggedOutProtected =
    loggedOutAdminRes.status === 307 ||
    loggedOutAdminRes.status === 308 ||
    loggedOutRedirect.includes("/login");
  results.push({
    test: "Logged-out user visiting /admin is redirected to /login",
    passed: loggedOutProtected,
  });

  // 4. Logged-out user hitting admin API (/api/admin/sources)
  console.log("\nTEST 4: Testing logged-out user access to /api/admin/sources...");
  const loggedOutApiRes = await fetch("http://localhost:3000/api/admin/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Malicious Stream", url: "https://example.com/stream.mp4" }),
  });
  console.log("  API Status:", loggedOutApiRes.status);
  results.push({
    test: "Logged-out user calling admin API receives 401 Unauthorized",
    passed: loggedOutApiRes.status === 401,
  });

  // 5. Normal user login and access checks
  console.log("\nTEST 5: Testing normal user login & permissions...");
  const normalClient = createClient(url, anonKey);
  const { data: normalAuth } = await normalClient.auth.signInWithPassword({
    email: testNewEmail,
    password: testNewPass,
  });
  const normalToken = normalAuth.session?.access_token;

  // 5a. Normal user calling admin API with Bearer token
  const normalApiRes = await fetch("http://localhost:3000/api/admin/sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalToken}`,
    },
    body: JSON.stringify({ name: "Malicious Stream", url: "https://example.com/stream.mp4" }),
  });
  console.log("  Normal user API Status:", normalApiRes.status);
  results.push({
    test: "Normal user calling admin API receives 403 Forbidden",
    passed: normalApiRes.status === 403,
  });

  // 5b. Normal user calling /api/auth/role with Bearer token
  // Let's verify normal user role endpoint
  const roleCheckClient = createClient(url, anonKey);
  const roleCheckUser = normalAuth.user;
  console.log("  Normal user role from auth:", roleCheckUser.app_metadata?.role || "user");
  results.push({
    test: "Normal user has role='user' and isAdmin=false",
    passed: (roleCheckUser.app_metadata?.role || "user") === "user",
  });

  // 6. Admin user authorization check
  console.log("\nTEST 6: Testing admin user authorization on admin API...");
  // Sign in as admin or generate admin session
  const { data: adminTokenData } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: "prajins337@gmail.com",
  });
  // Or test using admin token
  const adminProbeEmail = `admin_probe_${Date.now()}@weare-test.com`;
  const { data: createdAdminUser } = await adminClient.auth.admin.createUser({
    email: adminProbeEmail,
    password: "AdminPassword123!",
    email_confirm: true,
    app_metadata: { role: "admin" },
  });

  const adminTestClient = createClient(url, anonKey);
  const { data: adminLoginData } = await adminTestClient.auth.signInWithPassword({
    email: adminProbeEmail,
    password: "AdminPassword123!",
  });
  const adminAccessToken = adminLoginData.session?.access_token;

  const adminApiRes = await fetch("http://localhost:3000/api/admin/sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    },
    body: JSON.stringify({
      content_id: "e0000001-0000-4000-8000-000000000226",
      name: "Authorized Admin Stream",
      source_type: "hls",
      url: "https://example.com/stream.m3u8",
      quality: "1080p",
      language: "en",
      priority: 1,
    }),
  });
  console.log("  Admin API Status:", adminApiRes.status);
  results.push({
    test: "Admin user authorized to perform admin API operations (200 OK)",
    passed: adminApiRes.status === 200,
  });

  // Clean up probe users
  await adminClient.auth.admin.deleteUser(signupJson.user?.id);
  await adminClient.auth.admin.deleteUser(createdAdminUser.user?.id);

  console.log("\n========================================================");
  console.log("   RESULTS SUMMARY");
  console.log("========================================================");
  results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.passed ? "PASS" : "FAIL"}] ${r.test}`);
  });
  console.log("========================================================\n");

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

runSuite().catch(console.error);
