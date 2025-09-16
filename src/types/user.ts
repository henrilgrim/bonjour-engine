export interface User {
  id: string;
  nome: string;
  login: string;
  empresa_id: string;
  empresa_nome: string;
  accountcode: string;
  type: string;
  token_pxtalk: string;
  token_service: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tvMode: boolean;
}