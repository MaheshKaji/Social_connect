"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setAuth } from "@/lib/auth-client";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {
        setError("");
        setLoading(true);

        const isEmail = identifier.includes("@");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                isEmail
                    ? { email: identifier, password }
                    : { username: identifier, password }
            ),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error || "Login failed");
            return;
        }

        setAuth(data.token, data.user);
        router.push("/feed");
    };

    return (
        <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-12">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#111]">
                        SocialConnect
                    </h1>
                    <p className="text-sm text-[#888] mt-1">
                        Sign in to your account
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                            Email or Username
                        </label>
                        <input
                            className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                            placeholder="you@example.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && login()}
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full bg-[#111] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-[#888]">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-[#111] font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}