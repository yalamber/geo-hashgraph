'use client';
import { useEffect, useState } from 'react';
import { TransferTransaction, AccountId } from '@hashgraph/sdk';
import { useUser } from '@/context/UserContext';
import { useMagic } from '@/context/MagicProvider';
import { socket } from '@/lib/socket';
import { MagicWallet } from '@/lib/MagicWallet';
import { Hashgraph } from '@/lib/Hashgraph';
import Connect from '@/components/auth/connect';

export default function Chat() {
  const { magic } = useMagic();
  const { user, agentAccountBalance, loading } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchTopicMessages = async () => {
      if (!user) return;
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${process.env.NEXT_PUBLIC_TOPIC_ID}/messages`
        );
        const data = await response.json();
        // Transform the messages from the topic
        const topicMessages = data.messages.map(
          (msg: {
            message: string;
            [key: string]: string | number | boolean;
          }) => {
            const decodedMessage = JSON.parse(
              Buffer.from(msg.message, 'base64').toString()
            );
            return {
              from: decodedMessage.from || 'agent',
              message: decodedMessage.msg,
              transactionId: decodedMessage.transactionId,
            };
          }
        );

        // Add the initial message and the topic messages
        setMessages([
          {
            from: 'agent',
            message:
              'Compete with others to earn a prize pool of our agents balance',
          },
          ...topicMessages,
        ]);
      } catch (error) {
        console.error('Error fetching topic messages:', error);
      }
    };

    fetchTopicMessages();
  }, [user]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onMessageEvent(value: string) {
      const data = JSON.parse(value);
      setMessages((previous) => [...previous, data]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessageEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessageEvent);
    };
  }, []);

  const address = user?.address;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      if (!user?.address) return;
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

      const sendAmount = 5;

      let transactionTx = await new TransferTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .addHbarTransfer(user.address, -1 * sendAmount)
        .addHbarTransfer(process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID!, sendAmount)
        .freezeWithSigner(magicWallet);

      transactionTx = await transactionTx.signWithSigner(magicWallet);
      const transactionResult = await transactionTx.executeWithSigner(
        magicWallet
      );
      const transactionReceipt = await transactionResult.getReceiptWithSigner(
        magicWallet
      );
      if (transactionReceipt.status.toString() !== 'SUCCESS') {
        // TODO: handle error
        console.log(
          'something went wrong',
          transactionReceipt.status.toString()
        );
        return;
      }
      socket.emit(
        'message',
        JSON.stringify({
          message: newMessage,
          transactionId: transactionTx?.transactionId?.toString(),
        })
      );
      setNewMessage('');
    } catch (e) {
      console.log(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4">
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-4 text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Current Prize Pool</h2>
          <div className="text-3xl font-extrabold">
            {agentAccountBalance ? `${agentAccountBalance.toString()}` : '0'}
          </div>
        </div>
        <div
          className={`bg-gray-100 rounded-lg p-4 h-[600px] mb-4 overflow-y-auto ${
            !isConnected ? 'opacity-50' : ''
          }`}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 ${
                message.from === address ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  message.from === address
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300'
                }`}
              >
                <p className="text-sm opacity-50">{message.from}</p>
                <p>{message.message}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Pay 5 HBAR to participate"
            className="flex-1 p-2 border rounded-lg"
          />
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          ) : user ? (
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`px-4 py-2 rounded-lg ${
                newMessage.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Send'
              )}
            </button>
          ) : (
            <Connect label="Connect to chat" />
          )}
        </form>
      </div>
    </main>
  );
}
