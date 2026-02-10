import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Chrome, Phone, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  // State for Phone Auth
  const [isPhoneAuth, setIsPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await firebaseService.login(email, password);
      login(user);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      try {
          const user = await firebaseService.loginWithGoogle();
          login(user);
          navigate(from, { replace: true });
      } catch (err: any) {
          setError('Google Login failed: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        await firebaseService.requestPhoneOtp(phoneNumber, null);
        setIsOtpSent(true);
    } catch (err: any) {
        setError("Failed to send OTP: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          const user = await firebaseService.verifyPhoneOtp(phoneNumber, otp);
          login(user);
          navigate(from, { replace: true });
      } catch (err: any) {
          setError("Invalid OTP: " + err.message);
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
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {isPhoneAuth ? 'Phone Login' : 'Welcome Back'}
        </h2>
        <p className="text-slate-500 mb-8">Sign in to access your account</p>

        {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4 text-sm break-words">{error}</div>}

        {!isPhoneAuth ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            </form>
        ) : (
            <div>
                 <div id="recaptcha-container"></div>
                 {!isOtpSent ? (
                     <form onSubmit={handleSendOtp} className="space-y-4">
                         <Input
                             label="Phone Number (with country code)"
                             value={phoneNumber}
                             onChange={(e) => setPhoneNumber(e.target.value)}
                             placeholder="+1234567890"
                             required
                         />
                         <Button type="submit" fullWidth disabled={loading}>
                             {loading ? 'Sending OTP...' : 'Send OTP'}
                         </Button>
                     </form>
                 ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <Input
                             label="Enter OTP (Use 123456)"
                             value={otp}
                             onChange={(e) => setOtp(e.target.value)}
                             placeholder="123456"
                             required
                         />
                         <Button type="submit" fullWidth disabled={loading}>
                             {loading ? 'Verifying...' : 'Verify OTP'}
                         </Button>
                    </form>
                 )}
                 <button onClick={() => setIsPhoneAuth(false)} className="mt-4 text-sm text-primary hover:underline w-full text-center">
                     Use Email instead
                 </button>
            </div>
        )}

        {!isPhoneAuth && (
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
                    <Button type="button" variant="outline" onClick={() => setIsPhoneAuth(true)}>
                        <Phone className="w-4 h-4 mr-2" /> Phone
                    </Button>
                </div>
            </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-cyan-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};