import * as esbuild from 'esbuild';

const publicFunctions = [
  'onOpen',
  'onSelectionChange',
  'onEdit',

  'setupApiKey',
  'setupFolders',
  'importResumes',
  'setupTrigger',
  'setupRetentionPolicy',
  'purgeExpiredCandidates',
  'setupRetentionTrigger',
  'setupAdminEditors',
  'rebuildApplicantListSheet',
  'initAccessLogSheet',
  'setupLogAdminEditors',
  'initErrorLogSheet',
  'removeAllTriggers',
  'applyResumeRetentionPolicy',

  'setupAiEvaluationSheet',
  'showCurrentApplicantDetail',
  'restoreLatestEvaluation',
  'evaluateCurrentApplicant',
  'compareCurrentApplicantAcrossDepartments',
  'recreateAiEvaluationSheet',
  'initializeAiSecurity',
  'setupGeminiApiKey',
  'setupSourceSpreadsheet',
  'setupAiEvaluatorEmails',
  'setupCriteriaMaster',
];

const footer =
  publicFunctions
    .map(
      (name) =>
        `function ${name}(...args) {
  return GasApp.${name}(...args);
}`,
    )
    .join('\n\n');

await esbuild.build({
  entryPoints: [
    'src/gas/entrypoints.ts',
  ],

  bundle: true,

  platform: 'browser',

  format: 'iife',

  globalName: 'GasApp',

  target: 'es2020',

  outfile: 'dist/Code.js',

  footer: {
    js: footer,
  },
});