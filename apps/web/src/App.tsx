import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchaseCreateForm } from './features/purchases/components/PurchaseCreateForm';
import { Toaster } from './components/ui/sonner';
import { AuthSessions } from './features/auth/components/authSessions';
import { SignInUser } from './features/auth/components/signInUser';
import { SignOutUser } from './features/auth/components/signOutUser';
import { SignUpUser } from './features/auth/components/signUpUser';
function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <PurchasesIndex />
      <PurchaseCreateForm />
      <AuthSessions />
      <SignInUser />
      <SignOutUser />
      <SignUpUser />
    </>
  );
}

export default App;
