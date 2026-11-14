import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchaseCreateForm } from './features/purchases/components/PurchaseCreateForm';
import { Toaster } from './components/ui/sonner';
import { AuthSessions } from './features/auth/components/authSessions';
function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <h1>success!!</h1>
      <PurchasesIndex />
      <PurchaseCreateForm />
      <AuthSessions />
    </>
  );
}

export default App;
