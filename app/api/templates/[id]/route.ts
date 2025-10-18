import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle'; 
import { templates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// --- READ Single (GET): Retrieve a specific template by ID ---
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
        return new NextResponse('Invalid Template ID', { status: 400 });
    }

    try {
        const template = await db.select().from(templates)
            .where(eq(templates.id, templateId));

        if (template.length === 0) {
            return new NextResponse('Template not found', { status: 404 });
        }
        return NextResponse.json(template[0]);
    } catch (error) {
        console.error('Error fetching template:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// --- UPDATE (PUT/PATCH): Update a specific template by ID ---
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
        return new NextResponse('Invalid Template ID', { status: 400 });
    }

    try {
        const data = await req.json();
        // Filter the data to only include fields allowed for update
        const { name, subject, body } = data; 
        
        // Drizzle update statement
        const updatedTemplate = await db.update(templates)
            .set({ name, subject, body }) // Drizzle safely handles undefined/null fields
            .where(eq(templates.id, templateId))
            .returning();

        if (updatedTemplate.length === 0) {
            return new NextResponse('Template not found or no changes applied', { status: 404 });
        }

        return NextResponse.json(updatedTemplate[0]);
    } catch (error) {
        console.error('Error updating template:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// --- DELETE (DELETE): Delete a specific template by ID ---
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
        return new NextResponse('Invalid Template ID', { status: 400 });
    }

    try {
        // Drizzle delete statement
        const result = await db.delete(templates)
            .where(eq(templates.id, templateId))
            .returning({ id: templates.id });

        if (result.length === 0) {
            return new NextResponse('Template not found', { status: 404 });
        }
        
        // Success, but no content to return
        return new NextResponse(null, { status: 204 }); 
    } catch (error) {
        console.error('Error deleting template:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}