export interface UserIdentityProvider {
  getCurrentUserEmail(): string;
}

export interface PermissionRepository {
  getAdminEmail(): string;
  getEvaluatorEmails(): string[];
}

export class AuthorizationService {
  constructor(
    private readonly identityProvider: UserIdentityProvider,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  requireAdmin(): void {
    const currentUser = this.normalizeEmail(
      this.identityProvider.getCurrentUserEmail(),
    );

    const admin = this.normalizeEmail(
      this.permissionRepository.getAdminEmail(),
    );

    if (!currentUser) {
      throw new Error('現在のユーザーを確認できません。');
    }

    if (!admin) {
      throw new Error('管理者が設定されていません。');
    }

    if (currentUser !== admin) {
      throw new Error('管理者権限がありません。');
    }
  }

  requireEvaluator(): void {
    const currentUser = this.normalizeEmail(
      this.identityProvider.getCurrentUserEmail(),
    );

    if (!currentUser) {
      throw new Error('現在のユーザーを確認できません。');
    }

    const admin = this.normalizeEmail(
      this.permissionRepository.getAdminEmail(),
    );

    if (currentUser === admin) {
      return;
    }

    const evaluators = this.permissionRepository
      .getEvaluatorEmails()
      .map((email) => this.normalizeEmail(email))
      .filter(Boolean);

    if (!evaluators.includes(currentUser)) {
      throw new Error('AI評価を実行する権限がありません。');
    }
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }
}