'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Shield, Lock, ShieldAlert } from 'lucide-react';
import { getRoleConfig, RoleConfig } from '@/lib/roles';
import StartupVideo from '@/components/StartupVideo';

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showIntro, setShowIntro] = useState<boolean>(false);

  const handleDismissIntro = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem('drishti_intro_session_done', 'true');
    } catch (e) {}
  };

  // Is this the login page or root entry?
  const isLoginPage = pathname === '/login' || pathname === '/' || pathname === '' || !pathname || pathname?.startsWith('/login');

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('drishti_token');
      const userStr = localStorage.getItem('drishti_user');
      setIsAuthenticated(!!token);
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          // ignore
        }
      } else {
        setCurrentUser(null);
      }
      return !!token;
    }
    return false;
  };

  useEffect(() => {
    const hasToken = checkAuth();

    // Check if startup video should be displayed before login page
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('drishti_startup_video_shown');
        localStorage.removeItem('drishti_intro_seen_session');
      } catch (e) {}

      if (isLoginPage) {
        const alreadySeen = sessionStorage.getItem('drishti_intro_session_done');
        if (!alreadySeen) {
          setShowIntro(true);
        }
      }
    }

    // If on a protected route without a token, redirect to /login
    if (!hasToken && !isLoginPage) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }

    const handleStorageChange = () => {
      checkAuth();
    };

    const handleReplayIntro = () => {
      setShowIntro(true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('drishti_auth_change', handleStorageChange);
    window.addEventListener('drishti_replay_intro', handleReplayIntro);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('drishti_auth_change', handleStorageChange);
      window.removeEventListener('drishti_replay_intro', handleReplayIntro);
    };
  }, [pathname, router, isLoginPage]);

  // If on login page, show ONLY the login page! NO Navbar, NO Sidebar, NO other functionality!
  if (isLoginPage) {
    return (
      <>
        {showIntro && <StartupVideo onComplete={handleDismissIntro} />}
        <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Subtle background ambient lighting in Gold and Silver */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-slate-400/5 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
          
          <main className="w-full relative z-10">
            {children}
          </main>
        </div>
      </>
    );
  }

  // If checking authentication status or not authenticated yet on protected route
  if (isAuthenticated === false && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse shadow-lg shadow-amber-950/50">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex items-center space-x-2 text-amber-300 tracking-wider uppercase">
          <Lock className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>AUTHENTICATING OPERATOR ACCESS...</span>
        </div>
      </div>
    );
  }

  // Check RBAC module permission for the authenticated user
  const roleConfig: RoleConfig = getRoleConfig(currentUser?.role);
  const isAuthorized = !pathname || roleConfig.allowedNav.some((allowed) =>
    pathname === allowed || (allowed !== '/dashboard' && pathname.startsWith(allowed))
  );

  // If authenticated on protected routes: render Navbar, Sidebar, and Children
  return (
    <>
      {showIntro && <StartupVideo onComplete={handleDismissIntro} />}
      <div className="bg-[#060911] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <div className="flex flex-1 min-w-0">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full min-w-0">
          {isAuthorized ? (
            children
          ) : (
            <div className="max-w-2xl mx-auto my-12 bg-[#0c1222] border-2 border-rose-600/50 rounded-2xl p-8 shadow-2xl text-center space-y-5 font-mono">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950/60">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] bg-rose-950 border border-rose-700 text-rose-300 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                  DEFENCE CLEARANCE GATE
                </span>
                <h2 className="text-xl font-bold text-white tracking-wide mt-2">
                  RESTRICTED OPERATIONAL COMPARTMENT
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your active role (<strong className="text-amber-300 font-bold">{roleConfig.title}</strong>) does not have clearance to view this module.
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 max-w-md mx-auto flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">ACTIVE UNIT:</span>
                <span className="font-bold text-slate-200">{currentUser?.organization || roleConfig.unit}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider transition cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  RETURN TO MISSION DASHBOARD
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
