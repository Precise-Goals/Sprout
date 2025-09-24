"use client";
import { useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const {
    login,
    signup,
    loading,
    error: authError,
    isAuthenticated,
    user,
  } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    if (mode === "login") {
      res = await login(email, password);
    } else {
      const profile = {
        name,
        farmName,
        location: {
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
        },
      };
      res = await signup(email, password, profile);
    }
    if (!res.success)
      setError(
        res.message || (mode === "login" ? "Login failed" : "Signup failed")
      );
    if (res.success) router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      {mode === "signup" && (
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Farm name"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="border p-2 rounded"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <button
            type="button"
            className="text-sm text-blue-600 underline justify-self-start"
            onClick={() => {
              if (!navigator?.geolocation)
                return setError("Geolocation not supported");
              setError("");
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setLatitude(String(pos.coords.latitude));
                  setLongitude(String(pos.coords.longitude));
                },
                () => setError("Unable to get location")
              );
            }}
          >
            Use current location
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded"
          disabled={loading}
        >
          {loading
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
            ? "Login"
            : "Sign up"}
        </button>
        <button
          type="button"
          className="text-sm text-gray-600 underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Create account" : "Have an account? Login"}
        </button>
      </div>
      {(error || authError) && (
        <p className="text-red-500">{error || authError}</p>
      )}
      {isAuthenticated && (
        <p className="text-green-600">
          Signed in as {user?.email}
          {user?.demo ? " (demo)" : ""}
        </p>
      )}
    </form>
  );
}
