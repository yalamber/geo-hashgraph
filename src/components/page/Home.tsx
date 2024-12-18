'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CreateTag from '@/components/tag/create';
import { useMagic } from '@/context/MagicProvider';

interface TagItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function Homepage() {
  const { magic } = useMagic();
  const { user, loading } = useUser();

  const [tags, setTags] = useState<TagItem[]>([]);

  const fetchTags = useCallback(async () => {
    try {
      if (!user || !magic) return;
      const didToken = await magic.user.getIdToken();
      const response = await fetch(`/api/tag?accountId=${user.address}`, {
        headers: {
          'Authorization': `Bearer ${didToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, [user, magic]);

  useEffect(() => {
    if (user) fetchTags();
  }, [user, fetchTags]);

  const handleTagCreated = (newTag: TagItem) => {
    setTags((prevTags) => [...prevTags, newTag]);
  };

  return (
    <main className="flex flex-col min-h-screen p-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={loading ? 'pointer-events-none opacity-50' : ''}>
            <CreateTag onTagCreated={handleTagCreated} />
          </div>
          {/* Existing Topics */}
          {tags.map((tag) => (
            <Link href={`/tag/${tag.id}`} key={tag.id}>
              <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer min-h-[200px]">
                <h2 className="text-xl font-semibold mb-2">{tag.name}</h2>
                <p className="text-gray-600 mb-2">{tag.description}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(tag.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}

          {tags.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No geo tags created yet. Create your first geo tag to get started!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
