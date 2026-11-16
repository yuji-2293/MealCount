import { authClient } from '../../../lib/auth-client';
import { toast } from 'sonner';

export const SignOutUser = () => {
  const handleLogoutUser = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Logout successful');
        },
        onError: () => {
          toast.error('Logout failed');
        },
      },
    });
  };
  return (
    <div>
      <h2>Logout User</h2>
      <button
        onClick={() => {
          handleLogoutUser();
        }}
      >
        Logout
      </button>
    </div>
  );
};
