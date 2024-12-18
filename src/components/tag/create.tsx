import { useState } from 'react';
import { TransferTransaction } from '@hashgraph/sdk';
import { useUser } from '@/context/UserContext';
import { useMagic } from '@/context/MagicProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MagicWallet } from '@/lib/MagicWallet';
import { Hashgraph } from '@/lib/Hashgraph';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface TagItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function CreateTag({
  onTagCreated,
}: {
  onTagCreated?: (tag: TagItem) => void;
}) {
  const { magic } = useMagic();
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!user?.address) {
      return toast({
        title: 'Error',
        description: 'User account not found',
        variant: 'destructive',
      });
    }
    try {
      const { publicKeyDer } = await magic?.hedera.getPublicKey();
      const magicSign = async (message: Uint8Array): Promise<Uint8Array> => {
        const signature = await magic?.hedera.sign(message);
        if (!signature) throw new Error('Failed to sign');
        return signature;
      };
      const magicWallet = new MagicWallet(
        user.address,
        new Hashgraph(process.env.NEXT_PUBLIC_NETWORK!),
        publicKeyDer,
        magicSign
      );
      const sendAmount = 10;
      let transactionTx = await new TransferTransaction()
        .setTransactionMemo(`geotag-${user.address}`)
        .addHbarTransfer(user.address, -1 * sendAmount)
        .addHbarTransfer(process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID!, sendAmount)
        .freezeWithSigner(magicWallet);
      transactionTx = await transactionTx.signWithSigner(magicWallet);
      const transactionResult = await transactionTx.executeWithSigner(
        magicWallet
      );
      const transactionReceipt = await transactionResult.getReceiptWithSigner(
        magicWallet
      );
      if (transactionReceipt.status.toString() !== 'SUCCESS') {
        throw new Error('Transaction failed');
      }
      const response = await fetch('/api/tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          transactionId: transactionTx?.transactionId?.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tag');
      }

      const newTag = await response.json();

      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setOpen(false);

      // Notify parent component
      if (onTagCreated) {
        onTagCreated(newTag);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="border-2 border-dashed rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 min-h-[200px]">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="text-lg font-semibold">Create New Tag</span>
        </div>
      </DialogTrigger>
      <DialogContent className="top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateTag} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter tag name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
          />
          <Textarea
            placeholder="Enter tag description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Pay 10 ℏ and Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
