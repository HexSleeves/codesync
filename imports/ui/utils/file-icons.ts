export const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  pyw: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  mdx: 'markdown',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  vue: 'vue',
  svelte: 'svelte',
  xml: 'xml',
  svg: 'xml',
  dockerfile: 'docker',
  makefile: 'makefile',
  lua: 'lua',
  r: 'r',
  pl: 'perl',
  pm: 'perl',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  hrl: 'erlang',
  hs: 'haskell',
  clj: 'clojure',
  cljs: 'clojure',
  elm: 'elm',
  dart: 'dart',
  graphql: 'graphql',
  gql: 'graphql',
  prisma: 'prisma',
};

export function detectLanguage(filename: string): string {
  const name = filename.toLowerCase();

  // Special file names
  if (name === 'dockerfile') return 'docker';
  if (name === 'makefile') return 'makefile';
  if (name === '.gitignore' || name === '.gitattributes') return 'git';
  if (name === '.env' || name.endsWith('.env')) return 'ini';
  if (name === 'package.json' || name === 'tsconfig.json') return 'json';

  const ext = filename.split('.').pop()?.toLowerCase();
  return languageMap[ext || ''] || 'plaintext';
}

export const fileIconColors: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  ruby: '#cc342d',
  java: '#007396',
  go: '#00add8',
  rust: '#dea584',
  cpp: '#00599c',
  c: '#a8b9cc',
  csharp: '#239120',
  php: '#777bb4',
  html: '#e34f26',
  css: '#1572b6',
  scss: '#c6538c',
  json: '#292929',
  yaml: '#cb171e',
  markdown: '#083fa1',
  bash: '#4eaa25',
  sql: '#e38c00',
  swift: '#fa7343',
  kotlin: '#7f52ff',
  vue: '#42b883',
  svelte: '#ff3e00',
  docker: '#2496ed',
  git: '#f05032',
  default: '#6b7280',
};

export function getFileIconColor(language: string): string {
  return fileIconColors[language] || fileIconColors.default;
}

export function getFileStatusIcon(status: {
  isAdded?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
  isRenamed?: boolean;
}): { icon: string; color: string } {
  if (status.isAdded) return { icon: '+', color: '#22c55e' };
  if (status.isDeleted) return { icon: '−', color: '#ef4444' };
  if (status.isRenamed) return { icon: '→', color: '#f59e0b' };
  if (status.isModified) return { icon: '•', color: '#3b82f6' };
  return { icon: '', color: '' };
}
