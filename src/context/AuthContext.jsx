import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
const STORAGE_KEY = 'amto_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const armazenado = localStorage.getItem(STORAGE_KEY);
      if (armazenado) setUser(JSON.parse(armazenado));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (loginInput, senha) => {
    const { data, error } = await supabase.rpc('fazer_login', {
      p_login: loginInput.trim(),
      p_senha: senha,
    });

    if (error) {
      return { sucesso: false, mensagem: 'Não foi possível conectar ao servidor. Tente novamente.' };
    }
    if (!data || !data.sucesso) {
      return { sucesso: false, mensagem: data?.mensagem || 'Login ou senha inválidos.' };
    }

    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { sucesso: true, usuario: data };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const atualizarUsuario = useCallback((patch) => {
    setUser((atual) => {
      const proximo = { ...atual, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proximo));
      return proximo;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
