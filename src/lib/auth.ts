import { Magic } from '@magic-sdk/admin';

const magic = new Magic(process.env.MAGIC_SECRET_KEY);

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: 'Missing authorization header',
      status: 401,
    };
  }

  const didToken = authHeader.split('Bearer ')[1];
  try {
    magic.token.validate(didToken);
    const metadata = await magic.users.getMetadataByToken(didToken);
    return {
      authorized: true,
      address: metadata.publicAddress,
    };
  } catch (error: unknown) {
    console.error('Auth validation error:', error);
    return {
      error: 'Invalid token',
      status: 401,
    };
  }
} 