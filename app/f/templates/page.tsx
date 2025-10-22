// app/templates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getTemplatesAction } from '@/lib/db/actions';
import { Button } from '@/components/ui/button';
import { TemplateCard } from '@/app/components/template-card';
import { TemplateEditorModal } from '@/app/components/template-editor-modal';
import { PlusCircle } from 'lucide-react';

// This type must match your database schema
interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string | null;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load templates
const loadTemplates = async () => {
    setIsLoading(true);
    const result = await getTemplatesAction();

    // This is the updated part:
    if (result.success && result.data) {
      // We add && result.data to explicitly check that data is not undefined.
      setTemplates(result.data);
      setError(null);
    } else {
      // We provide a fallback error message in case result.error is also undefined.
      setError(result.error || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Templates</h1>
          <p className="text-muted-foreground">
            Create, edit, and delete your email templates.
          </p>
        </div>
        <TemplateEditorModal onActionComplete={loadTemplates}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        </TemplateEditorModal>
      </div>

      {isLoading && <p>Loading templates...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onActionComplete={loadTemplates}
              />
            ))
          ) : (
            <p>You haven't created any templates yet.</p>
          )}
        </div>
      )}
    </div>
  );
}