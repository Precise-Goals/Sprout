"use client";
import { useAuth } from "@hooks/useAuth";
import AuthForm from "@components/AuthForm";

type Farmer = {
  name?: string;
  farmName?: string;
  location?: { latitude?: number; longitude?: number };
  email?: string;
};

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {!isAuthenticated ? (
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-xl font-semibold">Sprout</h1>
          <AuthForm />
          <p className="mt-4 text-sm text-gray-500">
            Demo account: test@admin.com / testadmin
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-gray-700">
          <div className="text-lg font-semibold text-gray-900">
            Welcome, {user?.email || "Farmer"}
          </div>
          <p>
            Use the navigation to access Crop Recommender, Irrigation Scheduler,
            Agro-monitoring, Chat, and Voice Assistant.
          </p>
        </div>
      )}
    </div>
  );
}
