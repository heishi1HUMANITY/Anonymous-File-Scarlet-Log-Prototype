// components/LoginScreen.tsx
import React, { useState, FormEvent } from 'react';

interface LoginScreenProps {
  onLogin: (username: string, password?: string) => void;
  initialUsername?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, initialUsername = '' }) => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("ユーザー名を入力してください。"); // Basic validation
      return;
    }
    onLogin(username.trim(), password.trim()); // Password can be empty if not required
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-black text-green-400">
      <div className="w-full max-w-md p-6 md:p-8 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-teal-400 mb-6">Anonymous Cell</h1>
        <h2 className="text-xl text-center text-teal-300 mb-8">接続</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username-login" className="block text-sm font-medium text-teal-300 mb-1">ユーザー名:</label>
            <input
              type="text"
              id="username-login" // Unique ID for label association
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-green-300 placeholder-gray-500"
              placeholder="ユーザー名を入力"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password-login" className="block text-sm font-medium text-teal-300 mb-1">パスワード:</label>
            <input
              type="password"
              id="password-login" // Unique ID for label association
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-green-300 placeholder-gray-500"
              placeholder="パスワードを入力"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75"
          >
            接続
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
