"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
        first_name: "",
        last_name: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const register = async () => {
        setError("");
        setLoading(true);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error || "Registration failed");
            return;
        }

        router.push("/login");
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
                        Create your account
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                                First Name
                            </label>
                            <input
                                className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                                placeholder="John"
                                value={form.first_name}
                                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                                Last Name
                            </label>
                            <input
                                className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                                placeholder="Doe"
                                value={form.last_name}
                                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[#555] uppercase tracking-wider">
                            Username
                        </label>
                        <input
                            className="mt-1.5 w-full border border-[#e0e0e0] bg-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                            placeholder="johndoe"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
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
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={register}
                        disabled={loading}
                        className="w-full bg-[#111] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-[#888]">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#111] font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}