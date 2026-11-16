import { authClient } from '../../../lib/auth-client';
import { toast } from 'sonner';
import { useState } from 'react';

export const SignInUser = () => {
  const { data, isPending, error } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginUser = async () => {
    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          toast.success('ログイン成功');
        },
        onError: () => {
          toast.error('ログイン失敗');
        },
      }
    );
  };

  return (
    <div className="p-4 m-4 border border-gray-300 rounded">
      {isPending && <p>読み込み中...</p>}
      {error && <p>エラー: {error.message}</p>}
      <h2>ログイン</h2>
      {data && <p>ログイン中のユーザー: {data.user.name}</p>}
      {!data && !isPending && !error && (
        <div className="flex flex-col gap-2 items-center justify-center">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={() => {
              handleLoginUser();
            }}
          >
            ログイン
          </button>
        </div>
      )}
      <div></div>
    </div>
  );
};
