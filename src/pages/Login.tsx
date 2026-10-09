import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const Login: React.FC = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleAdminQuickLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await signIn('adm@cortex.com', 'cortex123');
      if (signInError) {
        setError('Erro ao autenticar administrador.');
      } else {
        navigate('/');
      }
    } catch (e) {
      setError('Erro ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isLoginTab) {
      if (!fullName) {
        setError('O nome completo é obrigatório.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLoginTab) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError('Email ou senha incorretos.');
        } else {
          navigate('/');
        }
      } else {
        const { error: signUpError } = await signUp(email, password, fullName);
        if (signUpError) {
          setError(signUpError.message || 'Erro ao criar conta. Tente novamente.');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-dark-800 p-3.5 rounded-2xl border border-dark-700/80 shadow-2xl mb-3">
            <Brain className="w-12 h-12 text-cortex-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-100 flex items-center gap-1.5">
            Cortex <span className="text-cortex-400 font-light">CRM</span>
          </h1>
          <p className="mt-1 text-sm text-dark-400">
            Inteligência comercial, funil e controle de oportunidades
          </p>
        </div>

        <div className="glass-card p-5 sm:p-8 rounded-2xl shadow-2xl border border-dark-700/60 backdrop-blur-xl">
          {/* Acesso Rápido ADM Cortex */}
          <div className="mb-6 p-4 rounded-xl bg-cortex-600/10 border border-cortex-500/25 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-cortex-300 font-medium text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cortex-400" />
              Acesso Administrador Oficial
            </div>
            <p className="text-xs text-dark-300">
              Entrar instantaneamente como <strong>Administrador Cortex</strong> com acesso irrestrito ao painel.
            </p>
            <button
              type="button"
              onClick={handleAdminQuickLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-cortex-600 hover:bg-cortex-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Entrar como ADM Cortex</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex mb-6 bg-dark-900/60 p-1 rounded-lg border border-dark-700/50">
            <button
              type="button"
              onClick={() => {
                setIsLoginTab(true);
                setError(null);
              }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200',
                isLoginTab
                  ? 'bg-dark-700 text-dark-100 shadow-sm'
                  : 'text-dark-400 hover:text-dark-200'
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginTab(false);
                setError(null);
              }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200',
                !isLoginTab
                  ? 'bg-dark-700 text-dark-100 shadow-sm'
                  : 'text-dark-400 hover:text-dark-200'
              )}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1" htmlFor="fullName">
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base w-full bg-dark-900/50"
                  placeholder="Administrador Cortex"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base w-full bg-dark-900/50"
                placeholder="adm@cortex.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base w-full bg-dark-900/50"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {!isLoginTab && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1" htmlFor="confirmPassword">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base w-full bg-dark-900/50"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 mt-2 font-medium flex justify-center items-center h-11"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLoginTab ? (
                'Entrar no Sistema'
              ) : (
                'Criar Minha Conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
