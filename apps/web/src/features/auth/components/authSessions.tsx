import { authClient } from '../../../lib/auth-client';

export const AuthSessions = () => {
  const { data, isPending, error }  = authClient.useSession();
  return (
    <div className="p-4 m-4 border border-gray-300 rounded">
      {isPending && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}

      {data && (
        <div className="text-red-300 text-2xl text-bold">
          {'ログイン中のユーザー: ' + data.user.name}
        </div>
      )}
      {!data && !isPending && !error && <p>No active session</p>}
    </div>
  );
};
