'use client';
import { Magic } from 'magic-sdk';
import { SDKBase, InstanceWithExtensions } from '@magic-sdk/provider';

import { HederaExtension } from '@magic-ext/hedera';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type MagicContextType = {
  magic: InstanceWithExtensions<SDKBase, HederaExtension[]> | null;
};

const MagicContext = createContext<MagicContextType>({
  magic: null,
});

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<InstanceWithExtensions<
    SDKBase,
    HederaExtension[]
  > | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAGIC_KEY) {
      const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_KEY || '', {
        extensions: [
          new HederaExtension({
            network: process.env.NETWORK ?? 'testnet',
          }),
        ],
      });
      setMagic(magic);
    } else {
      console.error('NEXT_PUBLIC_MAGIC_API_KEY is not set');
    }
  }, []);

  const value = useMemo(() => {
    return {
      magic,
    };
  }, [magic]);

  return (
    <MagicContext.Provider value={value}>{children}</MagicContext.Provider>
  );
};

export default MagicProvider;
