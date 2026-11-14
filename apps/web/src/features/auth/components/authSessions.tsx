import { authClient } from '../../../lib/auth-client';

export const AuthSessions = () => {
  const authSessions = authClient.useSession();
  const { data, isPending, error } = authSessions;
  console.log(data, isPending, error);
  return (
    <div>
      <h2>Auth Sessions</h2>
      {isPending && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {!data && !isPending && !error && <p>No active session</p>}
    </div>
  );
};
