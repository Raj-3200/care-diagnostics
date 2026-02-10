'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left Panel — Branding */}
      <div className="hidden w-[480px] flex-col justify-between bg-white p-12 lg:flex">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              Care Diagnostics
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
                Laboratory Information<br />Management System
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Streamline your diagnostic workflows with precision. 
                Manage patients, track samples, and generate reports — all in one calm, reliable platform.
              </p>
            </div>

            <div className="space-y-3">
              {[
                'Patient registration & visit management',
                'Sample tracking & result verification',
                'Automated report generation',
                'Complete billing & invoicing',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-[13.5px] text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-[12px] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Care Diagnostics. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">Care Diagnostics</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[24px] font-bold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Enter your credentials to access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@carediagnostics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10 rounded-lg border-border/60 bg-white text-[14px] placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 rounded-lg border-border/60 bg-white pr-10 text-[14px] placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-lg text-[14px] font-medium shadow-sm"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-xl border border-border/40 bg-white p-4">
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Demo Credentials
            </p>
            <div className="space-y-1.5 text-[13px] text-muted-foreground">
              <p><span className="font-medium text-foreground/70">Admin:</span> admin@carediagnostics.com / Admin@123456</p>
              <p><span className="font-medium text-foreground/70">Receptionist:</span> receptionist@carediagnostics.com / Staff@123456</p>
              <p><span className="font-medium text-foreground/70">Lab Tech:</span> labtech@carediagnostics.com / Staff@123456</p>
              <p><span className="font-medium text-foreground/70">Pathologist:</span> pathologist@carediagnostics.com / Staff@123456</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
