import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    sales_rep: 'Vendedor',
    manager: 'Gerente'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-dark-100">{title}</h1>
        {subtitle && <span className="text-xs text-dark-400">{subtitle}</span>}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-3 hover:bg-dark-800 p-1.5 rounded-lg transition-colors"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-dark-100">
              {profile?.full_name || 'Usuário'}
            </div>
            <div className="text-xs text-dark-400">
              {profile?.role ? roleLabels[profile.role] || profile.role : 'Usuário'}
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-cortex-600 flex items-center justify-center text-white font-medium border border-dark-600 shadow-sm">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Avatar'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(profile?.full_name || 'U')
            )}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2 border-b border-dark-700 sm:hidden">
              <div className="text-sm font-medium text-dark-100 truncate">
                {profile?.full_name}
              </div>
              <div className="text-xs text-dark-400">
                {profile?.role ? roleLabels[profile.role] || profile.role : ''}
              </div>
            </div>
            <button
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-dark-100 transition-colors"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Meu Perfil
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
