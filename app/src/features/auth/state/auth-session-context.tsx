
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  iniciarSesion,
  obtenerPerfil,
  type AuthTokens,
  type MobileProfile,
} from "../api/auth-api";

type Session = {
  tokens: AuthTokens;
  user: MobileProfile;
};

type AuthSessionContextValue = {
  user: MobileProfile | null;
  login: (
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
};

const AuthSessionContext =
  createContext<AuthSessionContextValue | null>(
    null
  );

export function AuthSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  async function login(
    email: string,
    password: string
  ): Promise<void> {
    const tokens = await iniciarSesion(
      email,
      password
    );

    // Comprobamos la identidad con el backend.
    const user = await obtenerPerfil(
      tokens.accessToken
    );

    // Solo guardamos la sesión si /me funciona.
    setSession({ tokens, user });
  }

  function logout(): void {
    // La sesión actual vive solo en memoria.
    setSession(null);
  }

  return (
    <AuthSessionContext.Provider
      value={{
        user: session?.user ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(
    AuthSessionContext
  );

  if (!context) {
    throw new Error(
      "Falta AuthSessionProvider."
    );
  }

  return context;
}
