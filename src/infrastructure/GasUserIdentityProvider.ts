import type {
  UserIdentityProvider,
} from '../security/AuthorizationService';

declare const Session: {
  getActiveUser(): { getEmail(): string };
  getEffectiveUser(): { getEmail(): string };
};

export class GasUserIdentityProvider
  implements UserIdentityProvider
{
  getCurrentUserEmail(): string {
    const activeUserEmail =
      Session.getActiveUser()
        .getEmail()
        .trim();

    if (activeUserEmail) {
      return activeUserEmail;
    }

    const effectiveUserEmail =
      Session.getEffectiveUser()
        .getEmail()
        .trim();

    if (effectiveUserEmail) {
      return effectiveUserEmail;
    }

    throw new Error(
      '現在のユーザー情報を取得できませんでした。',
    );
  }
}