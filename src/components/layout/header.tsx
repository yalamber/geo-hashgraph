'use client';
import { useUser } from '@/context/UserContext';
import Disconnect from '@/components/auth/disconnect';

export default function Header() {
  const { user, balance, loading } = useUser();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center">
        <span className="text-3xl font-extrabold text-blue-600">
          chat<span className="text-gray-800">#Graph</span>
        </span>
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
