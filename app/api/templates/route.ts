import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; // Your Drizzle DB instance
import { templates } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// --- READ (GET): Retrieve all accessible templates ---
export async function GET() {
    try {
        // Retrieve all templates. Since we are ignoring auth, we get all.
        // In a real app, this would be: WHERE user_id IS NULL OR user_id = [current user id]
        const allTemplates = await db.select().from(templates); 
        return NextResponse.json(allTemplates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// --- CREATE (POST): Create a new template ---
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { name, subject, body, userId } = data; // userId is optional

        if (!name || !body) {
            return new NextResponse('Missing required fields: name and body.', { status: 400 });
        }
        
        // Drizzle insert statement
        const newTemplate = await db.insert(templates).values({
            name,
            subject,
            body,
            userId: userId || null, // Set to provided ID or NULL for shared
        }).returning(); // .returning() gets the created record back

        return NextResponse.json(newTemplate[0], { status: 201 }); // Return the created template
    } catch (error) {
        console.error('Error creating template:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}