import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import type React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/UI/Toast";
import { Dashboard } from "./pages/Dashboard";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { SessionPage } from "./pages/Session";

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user, isLoading } = useTracker(
		() => ({
			user: Meteor.user(),
			isLoading: Meteor.loggingIn(),
		}),
		[],
	);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export const App: React.FC = () => {
	return (
		<ToastProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/session/:sessionId"
						element={
							<ProtectedRoute>
								<SessionPage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</ToastProvider>
	);
};
