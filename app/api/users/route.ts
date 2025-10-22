import { NextResponse } from "next/server";
// Import 'db' from drizzle
import { db } from "@/lib/db/drizzle";
// Import the 'users' table from schema
import { users } from "@/lib/db/schema";

export async function GET() {
  try {
    // Use the imported 'users' table directly
    const userList = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        company: users.company,
      })
      .from(users);

    return NextResponse.json(userList);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}