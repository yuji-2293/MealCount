import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchaseCreateForm } from './features/purchases/components/PurchaseCreateForm';
import { Toaster } from './components/ui/sonner';
import { AuthSessions } from './features/auth/components/authSessions';
import { SignInUser } from './features/auth/components/signInUser';
import { SignOutUser } from './features/auth/components/signOutUser';
import { SignUpUser } from './features/auth/components/signUpUser';
import { authClient } from './lib/auth-client';
import { MealStockIndex } from './features/mealStock/components/MealStockIndex';

function App() {
  const { data, isPending, error } = authClient.useSession();
  // サーバーに送信しない、クライアント側でのみ使用するユーザーID
  const userId = data?.user?.id;
  return (
    <>
      <Toaster position="top-right" richColors />
      {isPending && <p>Loading session...</p>}
      {error && <p>Error: {error.message}</p>}
      <PurchasesIndex userId={userId ?? ''} />
      <PurchaseCreateForm />
      <MealStockIndex userId={userId ?? ''} />
      <AuthSessions />
      <SignInUser />
      <SignOutUser />
      <SignUpUser />
    </>
  );
}

export default App;
