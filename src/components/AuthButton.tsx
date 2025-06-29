import { auth0 } from '@/lib/auth0';
import Image from 'next/image';
import { truncateName } from '@/lib/utils';

export default async function AuthButton() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <Image
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full"
              width={100}
              height={100}
            />
          )}
          <span className="text-white font-medium">
            {truncateName(user.name || user.email)}
          </span>
        </div>
        <a 
          href="/auth/logout"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a 
      href="/auth/login"
      className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
    >
      Login
    </a>
  );
} 