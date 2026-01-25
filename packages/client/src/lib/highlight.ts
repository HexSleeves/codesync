/**
 * Syntax highlighting with Prism.js
 */

import Prism from 'prismjs';

// Import common languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-diff';

// Map file extensions to Prism language keys
const extensionToLanguage: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  mts: 'typescript',
  cts: 'typescript',

  // Web
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'css',

  // Data
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',

  // Documentation
  md: 'markdown',
  mdx: 'markdown',

  // Shell
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'bash',

  // Systems
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',

  // Scripting
  php: 'php',
  rb: 'ruby',
  pl: 'perl',
  lua: 'lua',

  // Database
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',

  // Config
  dockerfile: 'docker',
  makefile: 'makefile',
  gitignore: 'gitignore',
  env: 'bash',
};

/**
 * Get Prism language from filename
 */
export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const basename = filename.split('/').pop()?.toLowerCase() || '';

  // Check special filenames first
  if (basename === 'dockerfile') return 'docker';
  if (basename === 'makefile') return 'makefile';
  if (basename.startsWith('.env')) return 'bash';

  return extensionToLanguage[ext] || 'plaintext';
}

/**
 * Highlight a single line of code
 * Returns HTML string with syntax highlighting
 */
export function highlightLine(code: string, language: string): string {
  if (!language || language === 'plaintext') {
    return escapeHtml(code);
  }

  const grammar = Prism.languages[language];
  if (!grammar) {
    return escapeHtml(code);
  }

  try {
    return Prism.highlight(code, grammar, language);
  } catch {
    return escapeHtml(code);
  }
}

/**
 * Highlight multiple lines of code
 * Returns array of HTML strings
 */
export function highlightLines(lines: string[], language: string): string[] {
  return lines.map((line) => highlightLine(line, language));
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
