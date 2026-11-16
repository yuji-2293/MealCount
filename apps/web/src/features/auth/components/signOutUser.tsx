import { authClient } from '../../../lib/auth-client';
import { toast } from 'sonner';

export const SignOutUser = () => {
  const { data } = authClient.useSession();
  const handleLogoutUser = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('ログアウト成功');
        },
        onError: () => {
          toast.error('ログアウト失敗');
        },
      },
    });
  };
  return (
    <div className="p-4 m-4 border border-gray-300 rounded">
      <h2>ログアウト</h2>
      {data && (
        <button
          onClick={() => {
            handleLogoutUser();
          }}
        >
          ログアウト
        </button>
      )}
      {!data && <p>未ログイン</p>}
    </div>
  );
};
