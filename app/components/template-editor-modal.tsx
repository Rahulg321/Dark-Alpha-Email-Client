'use client';

// Import the new server actions
import { saveTemplateAction, deleteTemplateAction } from '@/lib/db/actions';
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
import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

// ... (Template interface remains the same)

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface TemplateEditorModalProps {
  template?: Template | null;
  onSave: () => void;
  children: React.ReactNode;
}

export function TemplateEditorModal({
  template,
  onSave,
  children,
}: TemplateEditorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = template != null;

  // This client action handles closing the modal and refreshing the list
  const clientAction = async (formData: FormData) => {
    const result = await saveTemplateAction(formData);
    if (result.success) {
      onSave();
      setIsOpen(false);
    } else {
      // Optional: handle error display
      alert(result.error);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplateAction(template.id);
      onSave();
      setIsOpen(false);
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
        {/* The form now calls the server action */}
        <form action={clientAction} className="space-y-4 py-4">
          {isEditMode && (
            <input type="hidden" name="templateId" value={template.id} />
          )}
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input id="name" name="name" defaultValue={template?.name} required />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              defaultValue={template?.subject}
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={template?.body}
              rows={8}
            />
          </div>
          <DialogFooter className="flex items-center justify-between pt-4">
            <div>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}