import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ADMIN_EMAIL",
  "SUPABASE_ADMIN_PASSWORD"
];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error("Add SUPABASE_ADMIN_EMAIL and SUPABASE_ADMIN_PASSWORD to .env.local, then run again.");
  process.exit(1);
}

const email = process.env.SUPABASE_ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.SUPABASE_ADMIN_PASSWORD;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: WebSocket
    }
  }
);

let userId = null;
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

if (created?.user?.id) {
  userId = created.user.id;
}

if (createError) {
  const existingUser = await findExistingUser(email);

  if (!existingUser) {
    console.error(`Failed to create admin auth user: ${createError.message}`);
    process.exit(1);
  }

  userId = existingUser.id;
  const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true
  });

  if (passwordError) {
    console.error(`Failed to update existing admin password: ${passwordError.message}`);
    process.exit(1);
  }
}

const { error: adminError } = await supabase
  .from("admin_users")
  .upsert(
    {
      auth_user_id: userId,
      email,
      full_name: "Awesome Genie Admin",
      role: "admin",
      is_active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: "email" }
  );

if (adminError) {
  console.error(`Failed to upsert admin_users row: ${adminError.message}`);
  process.exit(1);
}

console.log("Admin user ready.");
console.log(`Email: ${email}`);
console.log("Password is stored in Supabase Auth and was not printed.");

async function findExistingUser(targetEmail) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      return null;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}
