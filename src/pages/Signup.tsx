import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail } from 'lucide-react';
import warehouseImage from '../assets/warehouse2.jpg';
import { supabase } from '../lib/supabase';   

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          username: formData.username,
        }
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Account created successfully! You can now login.");
      navigate('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 sm:p-6 relative"
         style={{ backgroundImage: `url(${warehouseImage})` }}>
      
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-5 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
           
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/80">Join REWB CORE and manage inventory smarter</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-white/10 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="User Name"
                className="w-full bg-white/10 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <User className="absolute right-5 top-4 text-white/60" />
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white/10 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Mail className="absolute right-5 top-4 text-white/60" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-white/10 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-4 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full bg-white/10 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-4 text-white/60 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-2xl text-white font-semibold text-lg transition"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-8 text-white/70">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
