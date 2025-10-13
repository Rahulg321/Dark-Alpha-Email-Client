'use client';
// Import the new component and useState
import { LeftSidebar } from '@/app/components/left-sidebar';
import { TemplatePanel } from '@/app/components/template-panel'; // <-- ADDED
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { sendEmailAction } from '@/lib/db/actions';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Paperclip, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useActionState, useState } from 'react'; // <-- ADDED useState

function DiscardDraftLink() {
  let { name } = useParams();

  return (
    <Link href={`/f/${name}`} className="text-gray-400 hover:text-gray-600">
      <Trash2 size={20} />
    </Link>
  );
}

// NOTE: We no longer need the separate EmailBody component
// We will move the textarea directly into the main component

export default function ComposePage() {
  let [state, formAction] = useActionState(sendEmailAction, {
    error: '',
    previous: {
      recipientEmail: '',
      subject: '',
      body: '',
    },
  });

  // --- NEW STATE MANAGEMENT ---
  // We now control the inputs with client-side state
  // This allows us to update them when a template is selected.
  const [recipient, setRecipient] = useState(
    state.previous.recipientEmail?.toString() || '',
  );
  const [subject, setSubject] = useState(
    state.previous.subject?.toString() || '',
  );
  const [body, setBody] = useState(state.previous.body?.toString() || '');
  // --- END NEW STATE MANAGEMENT ---

  const handleTemplateSelect = (template: {
    subject: string;
    body: string;
  }) => {
    setSubject(template.subject || '');
    setBody(template.body || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'Enter' || e.key === 'NumpadEnter')
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  return (
    // --- UPDATED LAYOUT ---
    <div className="flex h-full grow">
      <LeftSidebar />
      <div className="flex grow"> {/* This new flex container is key */}
        <div className="grow p-6">
          <h1 className="mb-6 text-2xl font-semibold">New Message</h1>
          {state.error && (
            <div className="mb-4">
              <Alert variant="destructive" className="relative">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </div>
          )}
          <form action={formAction} className="flex h-full flex-col space-y-4">
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500">
                To
              </span>
              <input
                type="email"
                name="recipientEmail"
                // --- UPDATED INPUTS TO BE CONTROLLED ---
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-12 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500">
                Subject
              </span>
              <input
                type="text"
                name="subject"
                // --- UPDATED INPUTS TO BE CONTROLLED ---
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-20 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* --- TEXTAREA MOVED HERE AND UPDATED --- */}
            <div className="grow">
              <textarea
                name="body"
                placeholder="Select a template or start typing... Tip: Hit Shift ⏎ to send"
                className="h-full w-full resize-none rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
                onKeyDown={handleKeyDown}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            {/* --- END TEXTAREA --- */}

            <div className="flex flex-col items-center justify-between sm:flex-row">
              <TooltipProvider>
                <div className="flex space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="submit"
                        disabled={isProduction}
                        className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send
                      </button>
                    </TooltipTrigger>
                    {isProduction && (
                      <TooltipContent>
                        <p>Sending emails is disabled in production</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  {/* ... other buttons ... */}
                </div>
                <div className="mt-4 ml-auto flex space-x-3 sm:mt-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        disabled
                        type="button"
                        className="cursor-pointer text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                      >
                        <Paperclip size={20} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attachments are not yet implemented</p>
                    </TooltipContent>
                  </Tooltip>
                  <Suspense fallback={<Trash2 size={20} />}>
                    <DiscardDraftLink />
                  </Suspense>
                </div>
              </TooltipProvider>
            </div>
          </form>
        </div>
        
        {/* --- ADDED TEMPLATE PANEL --- */}
        <TemplatePanel onTemplateSelect={handleTemplateSelect} />
      </div>
    </div>
  );
}