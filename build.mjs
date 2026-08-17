import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/gas/entrypoints.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'GasApp',
  target: 'es2020',
  outfile: 'dist/Code.js',

  footer: {
    js: `
    function onOpen() {
    return GasApp.onOpen();
  }
function evaluateApplicant(candidateKey, departmentId) {
  return GasApp.evaluateApplicant(candidateKey, departmentId);
}
`,
  },
});