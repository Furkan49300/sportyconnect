import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Activity, Plus, LayoutDashboard, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 bg-white/90 border-b border-black/5" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-carbon flex items-center justify-center">
              <Activity className="w-4 h-4 text-volt" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">SPORTSQUAD</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/activities" className="font-body text-sm font-medium text-gray-600 hover:text-carbon transition-colors" data-testid="nav-activities">
              Activités
            </Link>
            {user && (
              <>
                <Link to="/create" className="font-body text-sm font-medium text-gray-600 hover:text-carbon transition-colors" data-testid="nav-create">
                  Créer
                </Link>
                <Link to="/dashboard" className="font-body text-sm font-medium text-gray-600 hover:text-carbon transition-colors" data-testid="nav-dashboard">
                  Tableau de bord
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/create" data-testid="nav-create-btn">
                  <button className="btn-volt h-10 px-5 text-xs font-heading font-bold tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4" /> NOUVELLE ACTIVITÉ
                  </button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild data-testid="nav-user-menu">
                    <button className="flex items-center gap-2 cursor-pointer">
                      <Avatar className="h-8 w-8 border-2 border-carbon">
                        <AvatarImage src={getImageUrl(user.picture)} alt={user.name} />
                        <AvatarFallback className="bg-carbon text-volt font-heading text-xs">{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 font-body">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Tableau de bord
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                      <User className="w-4 h-4 mr-2" /> Profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <button
                onClick={() => {
                  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                  const redirectUrl = window.location.origin + '/dashboard';
                  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                }}
                className="btn-volt h-10 px-6 text-xs font-heading font-bold tracking-wider"
                data-testid="nav-login-btn"
              >
                SE CONNECTER AVEC GOOGLE
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-black/5 px-4 py-4 space-y-3" data-testid="mobile-menu">
          <Link to="/activities" onClick={() => setMobileOpen(false)} className="block font-body text-sm font-medium py-2">Activités</Link>
          {user ? (
            <>
              <Link to="/create" onClick={() => setMobileOpen(false)} className="block font-body text-sm font-medium py-2">Créer une activité</Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block font-body text-sm font-medium py-2">Tableau de bord</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block font-body text-sm font-medium py-2">Profil</Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block font-body text-sm font-medium py-2 text-red-500" data-testid="mobile-logout">Déconnexion</button>
            </>
          ) : (
            <button
              onClick={() => {
                // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                const redirectUrl = window.location.origin + '/dashboard';
                window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
              }}
              className="btn-volt w-full h-10 text-xs font-heading font-bold tracking-wider"
              data-testid="mobile-login-btn"
            >
              SE CONNECTER AVEC GOOGLE
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
