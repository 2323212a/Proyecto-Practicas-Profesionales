import type { AuthRepository } from "../../domain/auth/AuthRepository";
import type { AuthSession, LoginCredentials } from "../../domain/auth/AuthSession";
import { apiClient } from "../api/apiClient";

export class AuthHttpRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/login", credentials);
    return response.data;
  }
}
