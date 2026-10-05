import { PurchasesIndex } from './features/purchases/components/PurchasesIndex';
import { PurchasesCreate } from './features/purchases/components/PurchasesCreate';
import { Toaster } from './components/ui/sonner';
function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <h1>success!!</h1>
      <PurchasesIndex />
      <PurchasesCreate />
    </>
  );
}

export default App;
