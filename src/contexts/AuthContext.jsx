import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfilo(session.user.id);
      } else {
        setUser(null);
        setProfilo(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      await fetchProfilo(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfilo = async (userId) => {
    const { data } = await supabase
      .from('profili')
      .select('*')
      .eq('id', userId)
      .single();
    setProfilo(data);
  };

  const signUp = async (email, password, nome, cognome) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, cognome }
      }
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('profili').insert([{
        id: data.user.id,
        email,
        nome,
        cognome,
        ruolo: 'tecnico'
      }]);
    }

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfilo(null);
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    profilo,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAdmin: profilo?.ruolo === 'admin',
    isTecnico: profilo?.ruolo === 'tecnico'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;