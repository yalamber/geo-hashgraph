'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Disconnect from '@/components/auth/disconnect';
import { Button } from '@/components/ui/button';

export default function Header({ pageTitle }: { pageTitle: string }) {
  const { user, balance, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isHomePage = pathname === '/';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        {!isHomePage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Link href="/">
          <span className="text-3xl font-extrabold text-blue-600">
            geo<span className="text-gray-800">.delivery</span>
          </span>
        </Link>
        <span className="mx-3 text-gray-400">|</span>
        <h1 className="text-xl font-medium text-gray-700">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          user && (
            <>
              <span className="text-gray-600 text-sm">
                {user.address} • {balance?.toString()}
              </span>{' '}
              <Disconnect />
            </>
          )
        )}
      </div>
    </header>
  );
}
