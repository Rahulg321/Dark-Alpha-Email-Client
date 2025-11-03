import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/drizzle";
import { templates } from "@/lib/db/schema";

/**
 * POST /api/templates
 * body: { name, subject, body, userId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, subject, body: templateBody, userId } = body;
    if (!name || !userId) {
      return NextResponse.json({ error: "Missing name or userId" }, { status: 400 });
    }

    const inserted = await db.insert(templates).values({
      name,
      subject: subject ?? "",
      body: templateBody ?? "",
      userId: Number(userId),
    }).returning();

    const created = Array.isArray(inserted) && inserted[0] ? inserted[0] : inserted;
    return NextResponse.json({ success: true, id: created.id });
  } catch (err) {
    console.error("API /api/templates error:", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

/**
 * GET /api/templates
 * optional: returns list of templates (you may already have getTemplatesAction, but exposing this is handy)
 */
export async function GET() {
  try {
    const rows = await db.select().from(templates).orderBy(templates.createdAt.desc);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("API /api/templates GET error:", err);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
