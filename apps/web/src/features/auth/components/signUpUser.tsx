import { authClient } from '../../../lib/auth-client';
import { toast } from 'sonner';
import { useState } from 'react';

export const SignUpUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUpUser = async () => {
    await authClient.signUp
      .email({
        name,
        email,
        password,
      })
      .then(() => {
        toast.success('Sign up successful');
      })
      .catch(() => {
        toast.error('Sign up failed');
      });
  };

  return (
    <div className="p-4 m-4 border border-gray-300 rounded">
      <h2>新規登録</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
      <button onClick={handleSignUpUser}>新規登録</button>
    </div>
  );
};
