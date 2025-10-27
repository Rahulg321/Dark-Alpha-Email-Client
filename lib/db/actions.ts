'use server';

import { eq, and, asc } from 'drizzle-orm'; // <-- ADDED 'and' and 'asc'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from './drizzle'; // <-- RENAMED from './db' for consistency
import { emails, folders, threadFolders, threads, users, templates } from './schema'; // <-- ADDED templates

// --- ORIGINAL ACTIONS (UNCHANGED) ---

const sendEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  recipientEmail: z.string().email('Invalid email address'),
});

export async function sendEmailAction(_: any, formData: FormData) {
  let newThread;
  let rawFormData = {
    subject: formData.get('subject'),
    body: formData.get('body'),
    recipientEmail: formData.get('recipientEmail'),
  };

  if (process.env.VERCEL_ENV === 'production') {
    return {
      error: 'Only works on localhost for now',
      previous: rawFormData,
    };
  }

  try {
    let validatedFields = sendEmailSchema.parse({
      subject: formData.get('subject'),
      body: formData.get('body'),
      recipientEmail: formData.get('recipientEmail'),
    });

    let { subject, body, recipientEmail } = validatedFields;

    let [recipient] = await db
      .select()
      .from(users)
      .where(eq(users.email, recipientEmail));

    if (!recipient) {
      [recipient] = await db
        .insert(users)
        .values({ email: recipientEmail })
        .returning();
    }

    let result = await db
      .insert(threads)
      .values({
        subject,
        lastActivityDate: new Date(),
      })
      .returning();
    newThread = result[0];

    await db.insert(emails).values({
      threadId: newThread.id,
      senderId: 1, // Assuming the current user's ID is 1.
      recipientId: recipient.id,
      subject,
      body,
      sentDate: new Date(),
    });

    let [sentFolder] = await db
      .select()
      .from(folders)
      .where(eq(folders.name, 'Sent'));

    await db.insert(threadFolders).values({
      threadId: newThread.id,
      folderId: sentFolder.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, previous: rawFormData };
    }
    return {
      error: 'Failed to send email. Please try again.',
      previous: rawFormData,
    };
  }

  revalidatePath('/', 'layout');
  redirect(`/f/sent/${newThread.id}`);
}

export async function moveThreadToDone(_: any, formData: FormData) {
  if (process.env.VERCEL_ENV === 'production') {
    return {
      error: 'Only works on localhost for now',
    };
  }

  let threadId = formData.get('threadId');

  if (!threadId || typeof threadId !== 'string') {
    return { error: 'Invalid thread ID', success: false };
  }

  try {
    let doneFolder = await db.query.folders.findFirst({
      where: eq(folders.name, 'Archive'),
    });

    if (!doneFolder) {
      return { error: 'Done folder not found', success: false };
    }

    let parsedThreadId = parseInt(threadId, 10);

    await db
      .delete(threadFolders)
      .where(eq(threadFolders.threadId, parsedThreadId));

    await db.insert(threadFolders).values({
      threadId: parsedThreadId,
      folderId: doneFolder.id,
    });

    revalidatePath('/f/[name]');
    revalidatePath('/f/[name]/[id]');
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to move thread to Done:', error);
    return { success: false, error: 'Failed to move thread to Done' };
  }
}

export async function moveThreadToTrash(_: any, formData: FormData) {
  if (process.env.VERCEL_ENV === 'production') {
    return {
      error: 'Only works on localhost for now',
    };
  }

  let threadId = formData.get('threadId');

  if (!threadId || typeof threadId !== 'string') {
    return { error: 'Invalid thread ID', success: false };
  }

  try {
    let trashFolder = await db.query.folders.findFirst({
      where: eq(folders.name, 'Trash'),
    });

    if (!trashFolder) {
      return { error: 'Trash folder not found', success: false };
    }

    let parsedThreadId = parseInt(threadId, 10);

    await db
      .delete(threadFolders)
      .where(eq(threadFolders.threadId, parsedThreadId));

    await db.insert(threadFolders).values({
      threadId: parsedThreadId,
      folderId: trashFolder.id,
    });

    revalidatePath('/f/[name]');
    revalidatePath('/f/[name]/[id]');
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to move thread to Trash:', error);
    return { success: false, error: 'Failed to move thread to Trash' };
  }
}

// added by mataha

export async function getTemplatesAction() {
  // Following the pattern from sendEmailAction, we hard-code the user ID.
  const userId = 1;

  try {
    const data = await db
      .select()
      .from(templates)
      .where(eq(templates.userId, userId))
      .orderBy(asc(templates.name));

    return { success: true, data };
  } catch (error) {
    console.error('Action Error getting templates:', error);
    return { success: false, error: 'Failed to load templates.' };
  }
}

export async function saveTemplateAction(formData: FormData) {
  const userId = 1; // Hard-coded user ID

  const templateId = formData.get('templateId') as string | null;
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;

  try {
    if (templateId) {
      await db
        .update(templates)
        .set({ name, subject, body, updatedAt: new Date() })
        .where(
          and(eq(templates.id, Number(templateId)), eq(templates.userId, userId)),
        );
    } else {
      await db.insert(templates).values({ userId, name, subject, body });
    }
    revalidatePath('/f/[name]/new');
    return { success: true };
  } catch (error) {
    console.error('Action Error saving template:', error);
    return { success: false, error: 'Failed to save template.' };
  }
}

export async function deleteTemplateAction(templateId: string) {
  const userId = 1; // Hard-coded user ID

  try {
    await db
      .delete(templates)
      .where(
        and(eq(templates.id, Number(templateId)), eq(templates.userId, userId)),
      );
    revalidatePath('/f/[name]/new');
    return { success: true };
  } catch (error) {
    console.error('Action Error deleting template:', error);
    return { success: false, error: 'Failed to delete template.' };
  }
}
// --- ADD THIS NEW ACTION ---
export async function getTemplateByIdAction(templateId: number) {
  const userId = 1; // Assuming user ID 1 for now, as before
  
  try {
    const data = await db
      .select({
        subject: templates.subject,
        body: templates.body,
      })
      .from(templates)
      .where(
        and(eq(templates.id, templateId), eq(templates.userId, userId))
      )
      .limit(1);

    if (data.length === 0) {
      return { success: false, error: 'Template not found.' };
    }
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Action Error getting template by ID:', error);
    return { success: false, error: 'Failed to load template.' };
  }
}