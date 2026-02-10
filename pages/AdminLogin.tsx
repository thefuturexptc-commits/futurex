import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShieldCheck } from 'lucide-react';

export const AdminLogin: React.FC = () => {
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
    try {
      const user = await firebaseService.login(email, password);
      
      if (user.role !== 'admin') {
          throw new Error('Unauthorized access. This area is for administrators only.');
      }
      
      login(user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-2">Admin Portal</h2>
        <p className="text-slate-500 text-center mb-8">Secure Access Only</p>

        {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            autoFocus
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
            {loading ? 'Verifying Credentials...' : 'Access Dashboard'}
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <a href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Return to Storefront
            </a>
        </div>
      </div>
    </div>
  );
};