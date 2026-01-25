/**
 * Client-side router for Hono JSX-DOM SPA
 */

import { useState, useEffect } from 'hono/jsx';

export function useRouter() {
  const [path, setPath] = useState(globalThis.location.pathname);
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handlePopState = () => {
      setPath(globalThis.location.pathname);
    };
    globalThis.addEventListener('popstate', handlePopState);
    return () => globalThis.removeEventListener('popstate', handlePopState);
  }, []);

  // Parse path params
  useEffect(() => {
    const newParams: Record<string, string> = {};

    // Match /session/:id
    const sessionMatch = path.match(/^\/session\/([^/]+)/);
    if (sessionMatch) {
      newParams.sessionId = sessionMatch[1];
    }

    // Match /invite/:token
    const inviteMatch = path.match(/^\/invite\/([^/]+)/);
    if (inviteMatch) {
      newParams.token = inviteMatch[1];
    }

    setParams(newParams);
  }, [path]);

  return { path, params };
}

export function navigate(to: string) {
  globalThis.history.pushState({}, '', to);
  globalThis.dispatchEvent(new PopStateEvent('popstate'));
}

export function Link({ href, children, className = '' }: {
  href: string;
  children: any;
  className?: string;
}) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} class={className}>
      {children}
    </a>
  );
}
