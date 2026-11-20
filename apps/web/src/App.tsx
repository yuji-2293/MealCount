import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchaseCreateForm } from './features/purchases/components/PurchaseCreateForm';
import { Toaster } from './components/ui/sonner';
import { AuthSessions } from './features/auth/components/authSessions';
import { SignInUser } from './features/auth/components/signInUser';
import { SignOutUser } from './features/auth/components/signOutUser';
import { SignUpUser } from './features/auth/components/signUpUser';
import { authClient } from './lib/auth-client';
function App() {
  const { data } = authClient.useSession();
  // サーバーに送信しない、クライアント側でのみ使用するユーザーID
  const userId = data?.user?.id;
  return (
    <>
      <Toaster position="top-right" richColors />

      <PurchasesIndex userId={userId ?? ''} />
      <PurchaseCreateForm />
      <AuthSessions />
      <SignInUser />
      <SignOutUser />
      <SignUpUser />
    </>
  );
}

export default App;
