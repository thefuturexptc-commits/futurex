import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ArrowLeft, Chrome, Phone } from 'lucide-react';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
    }

    try {
      const user = await firebaseService.signup(name, email, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
        const user = await firebaseService.loginWithGoogle();
        login(user);
        navigate('/');
    } catch (err: any) {
        setError('Google Login failed: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Create Account</h2>
        <p className="text-slate-500 mb-8">Join the future of wearables</p>

        {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={handleGoogleLogin}>
                    <Chrome className="w-4 h-4 mr-2" /> Google
                </Button>
                {/* Phone signup is handled in login for simplicity in this demo */}
                <Link to="/login" className="w-full">
                     <Button type="button" variant="outline" fullWidth>
                        <Phone className="w-4 h-4 mr-2" /> Phone
                    </Button>
                </Link>
            </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-cyan-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};