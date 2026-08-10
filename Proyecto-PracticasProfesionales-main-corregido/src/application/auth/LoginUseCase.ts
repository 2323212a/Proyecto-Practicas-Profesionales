import type { AuthRepository } from "../../domain/auth/AuthRepository";
import type { AuthSession, LoginCredentials } from "../../domain/auth/AuthSession";

export class LoginUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(credentials: LoginCredentials): Promise<AuthSession> {
    return this.repository.login(credentials);
  }
}
