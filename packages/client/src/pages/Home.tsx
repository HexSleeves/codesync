/**
 * Home/Landing page
 */

import { Link } from '../router';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div class="min-h-screen bg-gray-900">
      {/* Header */}
      <header class="border-b border-gray-800">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 class="text-xl font-bold text-white">CodeSync</h1>
          <div class="flex gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main class="max-w-6xl mx-auto px-4 py-20">
        <div class="text-center">
          <h2 class="text-5xl font-bold text-white mb-6">
            Collaborative Code Review
          </h2>
          <p class="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Review code together in real-time. Import GitHub PRs, add comments,
            track changes, and collaborate with your team.
          </p>
          <div class="flex gap-4 justify-center">
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Start Reviewing
            </Link>
          </div>
        </div>

        {/* Features */}
        <div class="mt-24 grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Real-time Collaboration"
            description="See cursors, comments, and changes from your team as they happen."
            icon="👥"
          />
          <FeatureCard
            title="GitHub Integration"
            description="Import pull requests directly from GitHub with a single click."
            icon="🔗"
          />
          <FeatureCard
            title="Inline Comments"
            description="Add comments on specific lines and resolve discussions as you review."
            icon="💬"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div class="bg-gray-800 rounded-lg p-6">
      <div class="text-4xl mb-4">{icon}</div>
      <h3 class="text-lg font-semibold text-white mb-2">{title}</h3>
      <p class="text-gray-400">{description}</p>
    </div>
  );
}
