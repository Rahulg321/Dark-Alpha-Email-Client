'use client';

import { useEffect, useState } from 'react'; // <-- Import hooks
import { getTemplatesAction } from '@/lib/db/actions'; // <-- Import action
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle } from 'lucide-react';
import { TemplateEditorModal } from './template-editor-modal';

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface TemplatePanelProps {
  onTemplateSelect: (template: Template) => void;
}

export function TemplatePanel({ onTemplateSelect }: TemplatePanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

// Find this function in your file and replace it entirely
  const loadTemplates = async () => {
    setIsLoading(true);
    const result = await getTemplatesAction();

    if (result.success) {
      setTemplates(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  // Load templates when the component first mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  if (isLoading) return <div className="p-4">Loading templates...</div>;
  if (error) return <div className="p-4">{error}</div>;

  return (
    <div className="w-64 flex-shrink-0 border-l bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Templates</h2>
        {/* Pass the loadTemplates function to the modal so it can refresh the list */}
        <TemplateEditorModal onSave={loadTemplates}>
          <Button variant="ghost" size="icon">
            <PlusCircle className="size-5" />
          </Button>
        </TemplateEditorModal>
      </div>

      <div className="mt-4 space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-200"
            onClick={() => onTemplateSelect(template)}
          >
            <span className="text-sm">{template.name}</span>
            <TemplateEditorModal template={template} onSave={loadTemplates}>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover:visible"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="size-4" />
              </Button>
            </TemplateEditorModal>
          </div>
        ))}
      </div>
    </div>
  );
}