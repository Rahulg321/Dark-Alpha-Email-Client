import { getThreadsForFolder } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderName = searchParams.get('folder');
    const cursorDate = searchParams.get('cursorDate');
    const cursorId = searchParams.get('cursorId');
    const limit = searchParams.get('limit');

    if (!folderName) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 },
      );
    }

    const cursor =
      cursorDate && cursorId
        ? {
            lastActivityDate: cursorDate,
            id: parseInt(cursorId, 10),
          }
        : undefined;

    const result = await getThreadsForFolder(folderName, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
