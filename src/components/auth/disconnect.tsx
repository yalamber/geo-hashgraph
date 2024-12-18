'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMagic } from '@/context/MagicProvider';
import { useUser } from '@/context/UserContext';

const DisconnectButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { magic } = useMagic();
  const { fetchUser } = useUser();

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await magic?.user.logout();
      await fetchUser();
      
      // Redirect to homepage and refresh
      router.push('/');
      router.refresh();
      
    } catch (error) {
      console.log('handleDisconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="border-2 border-black font-bold p-2 rounded-md"
      onClick={handleDisconnect}
    >
      {isLoading ? 'Disconnecting...' : 'Disconnect'}
    </button>
  );
};

export default DisconnectButton;
