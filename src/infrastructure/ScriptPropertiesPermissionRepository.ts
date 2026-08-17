import type {
  PermissionRepository,
} from '../security/AuthorizationService';

declare const PropertiesService: GoogleAppsScript.Properties.PropertiesService;

export class ScriptPropertiesPermissionRepository
  implements PermissionRepository
{
  constructor(
    private readonly adminPropertyKey: string,
    private readonly evaluatorPropertyKey: string,
  ) {}

  getAdminEmail(): string {
    return (
      PropertiesService
        .getScriptProperties()
        .getProperty(
          this.adminPropertyKey,
        ) ?? ''
    );
  }

  getEvaluatorEmails(): string[] {
    const value =
      PropertiesService
        .getScriptProperties()
        .getProperty(
          this.evaluatorPropertyKey,
        );

    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(
        (email) => email !== '',
      );
  }
}