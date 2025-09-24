"use client";
import Link from "next/link";
import AuthForm from "@components/AuthForm";
import { useAuth } from "@hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      {!isAuthenticated ? (
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-xl font-semibold">Sprout</h1>
          <AuthForm />
          <p className="mt-4 text-sm text-gray-500">
            Demo account: test@admin.com / testadmin
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Sprout</h1>
          <p className="text-sm text-gray-700">
            Choose a feature to get started:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard"
              className="rounded border p-4 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link href="/crops" className="rounded border p-4 hover:bg-gray-50">
              Crop Recommender
            </Link>
            <Link
              href="/irrigation"
              className="rounded border p-4 hover:bg-gray-50"
            >
              Irrigation
            </Link>
            <Link href="/agro" className="rounded border p-4 hover:bg-gray-50">
              Agro-monitoring
            </Link>
            <Link href="/chat" className="rounded border p-4 hover:bg-gray-50">
              Chat
            </Link>
            <Link href="/voice" className="rounded border p-4 hover:bg-gray-50">
              Voice Assistant
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
