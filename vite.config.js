import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';

// Version shown on the home screen, from the latest git tag (create one with `git tag v1.2.0`):
//   v1.2.0              built exactly from the tagged commit
//   v1.2.0-3-g1c1bfdf   3 commits after v1.2.0, at commit 1c1bfdf
//   ...-dirty           built with uncommitted changes
//   1c1bfdf             no tag exists yet
// followed by the build date (UTC).
function getAppVersion() {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const version = execSync('git describe --tags --always --dirty', {
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();
    return `${version} · ${date}`;
  } catch {
    return `dev · ${date}`;
  }
}

const appVersionPlugin = () => {
  const version = getAppVersion();
  return {
    name: 'app-version',
    transformIndexHtml: (html) => html.replaceAll('__APP_VERSION__', version)
  };
};

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const pagesBase = isGitHubActions && repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base: pagesBase,
  plugins: [appVersionPlugin()],
  root: '.',
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/vite-env.d.ts', 'src/main.ts']
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    }
  }
});
