import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = params.id;

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Get tag details from Redis
    const tag = await redis.hgetall(`tag:${tagId}`);

    if (!tag || Object.keys(tag).length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = params.id;

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Delete tag data from Redis
    await redis.del(`tag:${tagId}`);

    // Remove tag from all accounts (you might want to track owner instead)
    const accounts = await redis.keys('account:*:tags');
    await Promise.all(
      accounts.map(async (accountKey) => {
        await redis.srem(accountKey, tagId);
      })
    );

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
