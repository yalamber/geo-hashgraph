'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Hbar, HbarUnit } from '@hashgraph/sdk';
import { Hashgraph } from '@/lib/Hashgraph';
import { useMagic } from './MagicProvider';

// Define the type for the user
type User = {
  address: string;
};

// Define the type for the user context.
type UserContextType = {
  user: User | null;
  balance: Hbar | null;
  agentAccountBalance: Hbar | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
};

// Create a context for user data.
const UserContext = createContext<UserContextType>({
  user: null,
  balance: new Hbar(0, HbarUnit.Hbar),
  agentAccountBalance: new Hbar(0, HbarUnit.Hbar),
  loading: true,
  fetchUser: async () => {},
});

// Custom hook for accessing user context data.
export const useUser = () => useContext(UserContext);

// Provider component that wraps parts of the app that need user context.
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  // Use the web3 context.
  const { magic } = useMagic();
  const hashClient = useMemo(
    () => new Hashgraph(process.env.NEXT_PUBLIC_NETWORK!),
    []
  );
  // Initialize user state to hold user's account information.
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<Hbar | null>(null);
  const [agentAccountBalance, setAgentAccountBalance] = useState<Hbar | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  // Function to retrieve and set user's account.
  const fetchUserAccount = useCallback(async () => {
    if (!magic) return;

    try {
      setLoading(true);

      const isLoggedIn = await magic.user.isLoggedIn();
      if (!isLoggedIn) return;

      const { publicAddress } = await magic.user.getInfo();
      if (!publicAddress) return;

      const accountBalance = await hashClient.getAccountBalance(publicAddress);
      const agentAccountBalance = await hashClient.getAccountBalance(
        process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID!
      );
      setAgentAccountBalance(agentAccountBalance.hbars);
      setBalance(accountBalance.hbars);
      setAddress(publicAddress);
    } catch (error) {
      console.error('Failed to fetch user account:', error);
      setBalance(null);
      setAddress(null);
    } finally {
      setLoading(false);
    }
  }, [magic, hashClient]);

  // Run fetchUserAccount function whenever the web3 instance changes.
  useEffect(() => {
    fetchUserAccount();
  }, [fetchUserAccount]);

  return (
    <UserContext.Provider
      value={{
        user: address ? { address } : null,
        balance,
        agentAccountBalance,
        loading,
        fetchUser: fetchUserAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
