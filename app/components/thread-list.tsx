'use client';

import { ThreadActions } from '@/app/components/thread-actions';
import { emails, users } from '@/lib/db/schema';
import { formatEmailString } from '@/lib/utils';
import { PenSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NavMenu } from './menu';

type Email = Omit<typeof emails.$inferSelect, 'threadId'> & {
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
};
type User = typeof users.$inferSelect;

type ThreadWithEmails = {
  id: number;
  subject: string | null;
  lastActivityDate: Date | null;
  emails: Email[];
};

interface ThreadListProps {
  folderName: string;
  threads: ThreadWithEmails[];
  searchQuery?: string;
}

export function ThreadHeader({
  folderName,
  count,
}: {
  folderName: string;
  count?: number | undefined;
}) {
  return (
    <div className="flex h-[70px] items-center justify-between border-b border-gray-200 p-4">
      <div className="flex items-center">
        <NavMenu />
        <h1 className="flex items-center text-xl font-semibold capitalize">
          {folderName}
          <span className="ml-2 text-sm text-gray-400">{count}</span>
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href={`/f/${folderName}/template`}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <PenSquare size={18} />
        </Link>
        <Link
          href="/search"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <Search size={18} />
        </Link>
      </div>
    </div>
  );
}

export function ThreadList({ folderName, threads }: ThreadListProps) {
  const [hoveredThread, setHoveredThread] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.matchMedia('(hover: none)').matches);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleMouseEnter = (threadId: number) => {
    if (!isMobile) {
      setHoveredThread(threadId);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredThread(null);
    }
  };

  return (
    <div className="grow overflow-hidden border-r border-gray-200">
      <ThreadHeader folderName={folderName} count={threads.length} />
      <div className="h-[calc(100vh-64px)] overflow-auto">
        {threads.map((thread) => {
          const latestEmail = thread.emails[0];
          const isUnread = thread.emails.some((e) => !(e as any).read);

          return (
            <Link
              key={thread.id}
              href={`/f/${folderName.toLowerCase()}/${thread.id}`}
              className={`block transition-colors ${
                isUnread ? 'bg-white hover:bg-accent' : 'bg-muted hover:bg-accent'
              }`}
              onMouseEnter={() => handleMouseEnter(thread.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-start justify-between p-4 border-b">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm truncate ${
                        isUnread ? 'font-semibold' : 'font-medium'
                      }`}
                    >
                      {formatEmailString(latestEmail.sender)}
                    </span>
                    {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>

                  <h3
                    className={`truncate ${
                      isUnread ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {thread.subject || '(No Subject)'}
                  </h3>

                  <p className="truncate text-sm text-muted-foreground">
                    {latestEmail.body}
                  </p>
                </div>

                <div className="flex items-center shrink-0 ml-4">
                  {!isMobile && hoveredThread === thread.id ? (
                    <ThreadActions threadId={thread.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {new Date(thread.lastActivityDate!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
