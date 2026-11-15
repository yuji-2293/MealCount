import { authClient } from '../../../lib/auth-client';
import { toast } from 'sonner';

export const LoginUser = () => {
  const handleLoginUser = async () => {
    await authClient.signIn.email(
      {
        email: 'test@example.com',
        password: 'TestPassword123!',
      },
      {
        onSuccess: () => {
          toast.success('Login successful');
        },
        onError: () => {
          toast.error('Login failed');
        },
      }
    );
  };

  return (
    <div>
      <h2>Login User</h2>
      <button
        onClick={() => {
          handleLoginUser();
        }}
      >
        Login
      </button>
    </div>
  );
};
