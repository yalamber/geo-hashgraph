'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Copy, Check } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Disconnect from '@/components/auth/disconnect';
import Connect from '@/components/auth/connect';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Header({ pageTitle }: { pageTitle: string }) {
  const { user, balance, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!user?.address) return;
    await navigator.clipboard.writeText(user.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHomePage = pathname === '/';

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-white shadow-sm gap-4 sm:gap-0">
      <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
        {!isHomePage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Back</span>
          </Button>
        )}
        <Link href="/" className="shrink-0">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            geo<span className="text-gray-800">.delivery</span>
          </span>
        </Link>
        <span className="mx-3 text-gray-400 hidden sm:inline">|</span>
        <h1 className="text-lg sm:text-xl font-medium text-gray-700 truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
        ) : user ? (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-gray-600 text-sm flex items-center">
                <span className="hidden sm:inline truncate max-w-[120px] md:max-w-[200px]">
                  {user.address}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0 mx-1 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="ml-2 shrink-0">
                  {balance?.toString()}
                  {balance?.toBigNumber().toNumber() === 0 && (
                    <a
                      href="https://portal.hedera.com/faucet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-600 underline"
                    >
                      Get test HBAR
                    </a>
                  )}
                </span>
              </span>
            </div>
            <Disconnect />
          </>
        ) : (
          <Connect />
        )}
      </div>
    </header>
  );
}
