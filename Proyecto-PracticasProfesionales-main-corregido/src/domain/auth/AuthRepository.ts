import type { AuthSession, LoginCredentials } from "./AuthSession";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
}
