'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface TagDetails {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  privateKey: string;
  publicKey: string;
}

export default function TagDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [tag, setTag] = useState<TagDetails | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTagDetails = async () => {
      try {
        const response = await fetch(`/api/tag/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTag(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch tag details',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching tag details:', error);
      }
    };

    if (params.id) {
      fetchTagDetails();
    }
  }, [params.id, toast]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !tag) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tag/${tag.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Failed to submit message');

      toast({
        title: 'Success',
        description: 'Message submitted successfully',
      });
      setMessage('');
    } catch (error) {
      console.error('Error submitting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrivateKey = async () => {
    if (!tag?.privateKey) return;
    await navigator.clipboard.writeText(tag.privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!tag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{tag.name}</CardTitle>
              <CardDescription>{tag.description}</CardDescription>
              <div className="flex gap-4 mt-4">
                <Link
                  href={`/tag/${tag.id}/feed`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  View Feed
                </Link>
                <Link
                  href={`/tag/${tag.id}/test-beacon`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                >
                  Test Beacon
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Topic ID</h3>
                  <code className="bg-gray-100 p-2 rounded block">
                    {tag.id}
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Private Key</h3>
                  <div className="relative">
                    <code className="bg-gray-100 p-2 pr-20 rounded block break-all">
                      {showPrivateKey
                        ? tag.privateKey
                        : '••••••••••••••••••••••••••'}
                    </code>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="h-8 w-8 p-0"
                      >
                        {showPrivateKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPrivateKey}
                        className="h-8 w-8 p-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Public Key</h3>
                  <code className="bg-gray-100 p-2 rounded block break-all">
                    {tag.publicKey}
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Created At</h3>
                  <p>{new Date(tag.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submit Message</CardTitle>
              <CardDescription>
                Send a message to this topic using the form below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitMessage} className="space-y-4">
                <Textarea
                  placeholder="Enter your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Submitting...' : 'Submit Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Submit Messages via API</h3>
                <p className="mb-2">
                  To submit messages to this topic, make a POST request with
                  your private key:
                </p>
                <code className="bg-gray-100 p-2 rounded block">
                  POST /api/tag/{tag.id}/feed
                </code>
                <p className="mt-2">Headers:</p>
                <pre className="bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(
                    {
                      Authorization: 'Bearer your-private-key',
                      'Content-Type': 'application/json',
                    },
                    null,
                    2
                  )}
                </pre>
                <p className="mt-2">Request body:</p>
                <pre className="bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(
                    {
                      message: 'Your message here',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Read Messages</h3>
                <p className="mb-2">To read messages from this topic:</p>
                <code className="bg-gray-100 p-2 rounded block">
                  GET /api/tag/{tag.id}/feed
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
