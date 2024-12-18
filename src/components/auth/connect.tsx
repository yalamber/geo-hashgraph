'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useMagic } from '@/context/MagicProvider';
import { useUser } from '@/context/UserContext';

const ConnectButton = ({ label = 'Connect to chat' }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { magic } = useMagic();
  const { fetchUser } = useUser();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await magic?.auth.loginWithEmailOTP({ email });
      await fetchUser();
      setOpen(false);
    } catch (error) {
      console.error('handleConnect:', error);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="mt-4">
              Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectButton;
