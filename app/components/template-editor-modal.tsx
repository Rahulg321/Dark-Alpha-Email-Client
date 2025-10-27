'use client';

import { saveTemplateAction } from '@/lib/db/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { toast } from 'sonner';

interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string | null;
}

interface TemplateEditorModalProps {
  template?: Template | null; // Pass a template to edit, or null to create
  onActionComplete: () => void; // A function to refresh the template list
  children: React.ReactNode; // The button that opens the dialog
}

const PLACEHOLDERS = [
  '{firstName}',
  '{lastName}',
  '{company}',
  '{jobTitle}',
  '{email}',
];

export function TemplateEditorModal({
  template,
  onActionComplete,
  children,
}: TemplateEditorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = template != null;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea

  useEffect(() => {
    if (isOpen) {
      setSubject(template?.subject || '');
      setBody(template?.body || '');
    }
  }, [isOpen, template]);

  const clientAction = async (formData: FormData) => {
    formData.set('subject', subject);
    formData.set('body', body);

    if (isEditMode) {
      formData.append('templateId', String(template.id));
    }

    const result = await saveTemplateAction(formData);
    if (result.success) {
      toast.success(isEditMode ? 'Template updated!' : 'Template created!');
      onActionComplete();
      setIsOpen(false);
    } else {
      toast.error(result.error as string);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = body;
    const newBody =
      currentBody.substring(0, start) + placeholder + currentBody.substring(end);

    setBody(newBody);


    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
           e.preventDefault();
           const formData = new FormData(e.currentTarget);
           await clientAction(formData);
        }} className="space-y-4 py-4">

          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={template?.name}
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject" // Keep name for potential future use, though we use state now
              value={subject} // Use state
              onChange={(e) => setSubject(e.target.value)} // Update state
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {PLACEHOLDERS.map((placeholder) => (
                <Button
                  key={placeholder}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="px-2 py-0.5 text-xs"
                  onClick={() => insertPlaceholder(placeholder)}
                >
                  {placeholder}
                </Button>
              ))}
            </div>
            <Textarea
              id="body"
              name="body" // Keep name for potential future use
              ref={bodyTextareaRef} // Add ref
              value={body} // Use state
              onChange={(e) => setBody(e.target.value)} // Update state
              rows={8}
            />
          </div>
          <DialogFooter className="flex items-center justify-between pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}