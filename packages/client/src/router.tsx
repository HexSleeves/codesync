/**
 * Client-side router for Hono JSX-DOM SPA
 */

import { useEffect, useState } from 'hono/jsx';

// Global navigation event
const NAVIGATE_EVENT = 'app:navigate';

export function useRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleNavigation = () => {
      setPath(window.location.pathname);
    };

    // Listen for browser back/forward
    window.addEventListener('popstate', handleNavigation);
    // Listen for programmatic navigation
    window.addEventListener(NAVIGATE_EVENT, handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener(NAVIGATE_EVENT, handleNavigation);
    };
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

    // Match /shared/:token
    const sharedMatch = path.match(/^\/shared\/([^/]+)/);
    if (sharedMatch) {
      newParams.shareToken = sharedMatch[1];
    }

    setParams(newParams);
  }, [path]);

  return { path, params };
}

export function navigate(to: string) {
  window.history.pushState({}, '', to);
  // Dispatch custom event to trigger re-render
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT));
}

export function Link({
  href,
  children,
  className,
  class: cls,
}: {
  href: string;
  children: any;
  className?: string;
  class?: string;
}) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className || cls || ''}>
      {children}
    </a>
  );
}
