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
import { useState } from 'react';
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

export function TemplateEditorModal({
  template,
  onActionComplete,
  children,
}: TemplateEditorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = template != null;

  const clientAction = async (formData: FormData) => {
    // Add templateId if in edit mode
    if (isEditMode) {
      formData.append('templateId', String(template.id));
    }

    const result = await saveTemplateAction(formData);
    if (result.success) {
      toast.success(isEditMode ? 'Template updated!' : 'Template created!');
      onActionComplete();
      setIsOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        <form action={clientAction} className="space-y-4 py-4">
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
              name="subject"
              defaultValue={template?.subject || ''}
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={template?.body || ''}
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