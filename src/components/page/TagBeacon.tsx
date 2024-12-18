'use client';

import { useState, useEffect } from 'react';
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

interface TagDetails {
  id: string;
  name: string;
  privateKey: string;
}

export default function TagBeaconPage() {
  const params = useParams();
  const { toast } = useToast();
  const { magic } = useMagic();
  const [tag, setTag] = useState<TagDetails | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [interval, setIntervalId] = useState<NodeJS.Timeout | null>(null);

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

  const sendBeaconMessage = async () => {
    if (!tag) return;

    try {
      const message = {
        timestamp: new Date().toISOString(),
        type: 'beacon',
        data: {
          lat: (Math.random() * 180 - 90).toFixed(6),
          lng: (Math.random() * 360 - 180).toFixed(6),
          altitude: Math.floor(Math.random() * 1000),
        },
      };

      const response = await fetch(`/api/tag/${tag.id}/feed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tag.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: JSON.stringify(message) }),
      });

      if (!response.ok) throw new Error('Failed to send beacon message');

    } catch (error) {
      console.error('Error sending beacon:', error);
      toast({
        title: 'Error',
        description: 'Failed to send beacon message',
        variant: 'destructive',
      });
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    const id = setInterval(sendBeaconMessage, 5000); // Send every 5 seconds
    setIntervalId(id);
  };

  const stopSimulation = () => {
    if (interval) {
      clearInterval(interval);
      setIntervalId(null);
    }
    setIsSimulating(false);
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
            <CardTitle>Beacon Simulator</CardTitle>
            <CardDescription>
              Simulate a beacon sending location updates to topic: {tag.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                This simulator will send random location data every 5 seconds to
                simulate a moving beacon. The data includes:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Random latitude (-90 to 90)</li>
                <li>Random longitude (-180 to 180)</li>
                <li>Random altitude (0 to 1000m)</li>
                <li>Current timestamp</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              {!isSimulating ? (
                <Button onClick={startSimulation}>
                  Start Simulation
                </Button>
              ) : (
                <Button
                  onClick={stopSimulation}
                  variant="destructive"
                >
                  Stop Simulation
                </Button>
              )}
            </div>

            {isSimulating && (
              <div className="text-center text-sm text-muted-foreground">
                Sending beacon updates every 5 seconds...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
