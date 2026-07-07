import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import warehouseImage from '../assets/warehouse2.jpg';
import { supabase } from '../lib/supabase';   // ← Import added

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    alert(error.message);
    setIsLoading(false);
    return;
  }

  // Logged in user
  const user = data.user;

  // Get role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    alert("Unable to fetch user profile.");
    setIsLoading(false);
    return;
  }

  alert(" Login Successful!");

  if (profile.role === "admin") {
    navigate("/admin");
  } else {
    navigate("/dashboard");
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
           
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Login</h1>
            <p className="text-white/80">Welcome back please login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-white/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 py-4 rounded-2xl text-white font-semibold text-lg hover:brightness-110 transition"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-8 text-white/70">
            Don't have an account? <Link to="/signup" className="text-emerald-400 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
