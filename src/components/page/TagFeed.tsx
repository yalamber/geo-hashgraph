'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMagic } from '@/context/MagicProvider';

interface Message {
  sequenceNumber: string;
  consensusTimestamp: string;
  message: string;
  topicId: string;
}

interface TagDetails {
  id: string;
  name: string;
}

export default function TagFeedPage() {
  const params = useParams();
  const { toast } = useToast();
  const { magic } = useMagic();
  const [tag, setTag] = useState<TagDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const formatConsensusTimestamp = (timestamp: string) => {
    const [seconds, nanos] = timestamp.split('.');
    const milliseconds = parseInt(seconds) * 1000 + parseInt(nanos.slice(0, 3));
    return new Date(milliseconds).toLocaleString();
  };

  const fetchMessages = useCallback(async () => {
    if (!tag || !magic) return;
    setIsLoading(true);
    try {
      const didToken = await magic.user.getIdToken();
      const response = await fetch(`/api/tag/${tag.id}/feed`, {
        headers: {
          'Authorization': `Bearer ${didToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tag, magic, toast]);

  useEffect(() => {
    const fetchTagDetails = async () => {
      try {
        if (!magic) return;
        const didToken = await magic.user.getIdToken();
        const response = await fetch(`/api/tag/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${didToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTag(data);
        }
      } catch (error) {
        console.error('Error fetching tag details:', error);
      }
    };

    if (params.id) {
      fetchTagDetails();
    }
  }, [params.id, magic]);

  useEffect(() => {
    if (tag) {
      fetchMessages();
    }
  }, [tag, fetchMessages]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      intervalId = setInterval(fetchMessages, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchMessages]);

  const formatMessage = (messageStr: string) => {
    try {
      const parsed = JSON.parse(messageStr);
      if (parsed.type === 'beacon') {
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">Beacon Update</div>
            <div className="text-sm">
              Location: {parsed.data.lat}, {parsed.data.lng}
            </div>
            <div className="text-sm">Altitude: {parsed.data.altitude}m</div>
            <div className="text-xs text-muted-foreground">
              Beacon Time: {new Date(parsed.timestamp).toLocaleString()}
            </div>
          </div>
        );
      }
      return <pre className="text-sm">{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <div className="text-sm">{messageStr}</div>;
    }
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Message Feed</CardTitle>
                <CardDescription>
                  Messages from topic: {tag.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Stop Auto-refresh' : 'Auto-refresh'}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchMessages}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Fetching messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages found in this topic.
                </div>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.sequenceNumber}>
                    <CardContent className="pt-4">
                      {formatMessage(msg.message)}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Sequence: {msg.sequenceNumber} | 
                        Consensus Time: {formatConsensusTimestamp(msg.consensusTimestamp)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
