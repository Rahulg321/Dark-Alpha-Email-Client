'use client';

import {
  deleteTemplateAction,
  getTemplatesAction,
  saveTemplateAction,
} from '@/lib/db/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TemplateEditorModal } from './template-editor-modal'; // We will create this

interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string | null;
}

interface TemplateCardProps {
  template: Template;
  onActionComplete: () => void; // Function to refresh the list
}

export function TemplateCard({
  template,
  onActionComplete,
}: TemplateCardProps) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      const result = await deleteTemplateAction(String(template.id));
      if (result.success) {
        toast.success('Template deleted.');
        onActionComplete();
      } else {
        toast.error(result.error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.subject || 'No Subject'}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {template.body || 'No Body'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <TemplateEditorModal
          template={template}
          onActionComplete={onActionComplete}
        >
          <Button variant="outline">Edit</Button>
        </TemplateEditorModal>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}