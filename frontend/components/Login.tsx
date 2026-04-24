
import React, { useState } from 'react';
import { ShieldCheckIcon } from './Icons';
import axios from "axios";


interface AuthFormProps {
  onLogin: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (authMode === "signup") {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      await axios.post("http://localhost:5000/api/auth/signup", {
        email,
        password,
        username: email.split("@")[0],
      });

      alert("Signup successful!");
      setAuthMode("login");
      return;
    }

    if (authMode === "login") {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login successful!");
      onLogin();
      return;
    }

    if (authMode === "forgot") {
      alert("Forgot password API not added yet.");
    }
  } catch (error: any) {
    console.error(error);
    alert(error.response?.data?.message || "Something went wrong");
  }
};


  const renderForm = () => {
    switch (authMode) {
      case 'signup':
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Create Account</h2>
            <p className="text-center text-text-secondary mb-6">Start your journey to a secure digital life.</p>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-4 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-4 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-6 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <button type="submit" className="w-full bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300">
              Sign Up
            </button>
            <p className="text-center text-sm text-text-secondary mt-6">
              Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="font-semibold text-accent hover:underline">
                Log In
              </button>
            </p>
          </>
        );
      case 'forgot':
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Reset Password</h2>
            <p className="text-center text-text-secondary mb-6">Enter your email to get a reset link.</p>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-6 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <button type="submit" className="w-full bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300">
              Send Reset Link
            </button>
            <p className="text-center text-sm text-text-secondary mt-6">
              Remember your password?{' '}
              <button onClick={() => setAuthMode('login')} className="font-semibold text-accent hover:underline">
                Log In
              </button>
            </p>
          </>
        );
      case 'login':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-text-primary mb-2">Welcome Back!</h2>
            <p className="text-center text-text-secondary mb-6">Log in to continue to Cyber Shield.</p>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-4 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-primary border border-border-color rounded-md px-4 py-2 mb-4 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <div className="text-right mb-6">
              <button onClick={() => setAuthMode('forgot')} className="text-sm font-semibold text-accent hover:underline">
                Forgot Password?
              </button>
            </div>
            <button type="submit" className="w-full bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300">
              Log In
            </button>
            <p className="text-center text-sm text-text-secondary mt-6">
              Don't have an account?{' '}
              <button onClick={() => setAuthMode('signup')} className="font-semibold text-accent hover:underline">
                Sign Up
              </button>
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-accent p-4 rounded-full">
            <ShieldCheckIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-center text-text-primary mb-2">Cyber Shield</h1>
        <div className="bg-secondary border border-border-color rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit}>
            {renderForm()}
          </form>
        </div>
      </div>
    </div>
  );
};
