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
  issuer: string;
};

// Define the type for the user context.
type UserContextType = {
  user: User | null;
  balance: Hbar | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  onLogout: () => void;
};

// Create a context for user data.
const UserContext = createContext<UserContextType>({
  user: null,
  balance: new Hbar(0, HbarUnit.Hbar),
  loading: true,
  fetchUser: async () => {},
  onLogout: () => {},
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
  const [issuer, setIssuer] = useState<string | null>(null);
  const [balance, setBalance] = useState<Hbar | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Function to retrieve and set user's account.
  const fetchUserAccount = useCallback(async () => {
    if (!magic) return;
    try {
      setLoading(true);
      const isLoggedIn = await magic.user.isLoggedIn();
      if (!isLoggedIn) return;
      const { publicAddress, issuer } = await magic.user.getInfo();
      if (!publicAddress || !issuer) return;

      const accountBalance = await hashClient.getAccountBalance(publicAddress);
      setBalance(accountBalance.hbars);
      setAddress(publicAddress);
      setIssuer(issuer);
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

  function onLogout() {
    setIssuer(null);
    setBalance(null);
    setAddress(null);
  }

  return (
    <UserContext.Provider
      value={{
        user: address && issuer ? { address, issuer } : null,
        balance,
        loading,
        fetchUser: fetchUserAccount,
        onLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
