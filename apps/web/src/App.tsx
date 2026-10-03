import type { AppType } from '../../api/src';
import { hc } from 'hono/client';

const client = hc<AppType>('http://localhost:8787');

const res = await client.index.$get();
console.log(res);

function App() {
  return (
    <>
      <h1>success!! cloudflare deployment Mealcount Web</h1>
    </>
  );
}

export default App;
