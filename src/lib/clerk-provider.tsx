import { ClerkProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

interface ExtensionClerkProviderProps {
  children: ReactNode;
}

export function ExtensionClerkProvider({ children }: ExtensionClerkProviderProps) {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
