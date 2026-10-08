import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchaseCreateForm } from './features/purchases/components/PurchaseCreateForm';
import { Toaster } from './components/ui/sonner';
function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <h1>success!!</h1>
      <PurchasesIndex />
      <PurchaseCreateForm />
    </>
  );
}

export default App;
