export default function Footer() {
  return (
    <footer className="fixed bottom-0 w-full bg-white shadow-sm py-2">
      <div className="container mx-auto text-center text-sm text-gray-600">
        {process.env.NEXT_PUBLIC_NETWORK && (
          <p>
            Connected to:{' '}
            {process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
              ? 'Mainnet'
              : 'Testnet'}
          </p>
        )}
      </div>
    </footer>
  );
}
