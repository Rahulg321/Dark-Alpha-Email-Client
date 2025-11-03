import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/drizzle";

export async function GET() {
  try {
    const users = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        company: schema.users.company,
      })
      .from(schema.users);

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
