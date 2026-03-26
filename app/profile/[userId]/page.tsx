"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser } from "@/lib/auth-client";

interface UserProfile {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    website: string | null;
    location: string | null;
    posts_count: number;
    created_at: string;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ bio: "", website: "", location: "", first_name: "", last_name: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = getUser();
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }
        fetchProfileData();
    }, [userId]);

    const fetchProfileData = async () => {
        try {
            const [profileRes, followersRes, followingRes] = await Promise.all([
                fetch(`/api/users/${userId}`),
                fetch(`/api/users/${userId}/followers`),
                fetch(`/api/users/${userId}/following`)
            ]);

            if (!profileRes.ok) {
                router.push("/feed");
                return;
            }

            const profileData = await profileRes.json();
            const followersData = await followersRes.json();
            const followingData = await followingRes.json();

            setProfile(profileData.user);
            setEditForm({
                bio: profileData.user.bio || "",
                website: profileData.user.website || "",
                location: profileData.user.location || "",
                first_name: profileData.user.first_name || "",
                last_name: profileData.user.last_name || "",
            });

            setFollowersCount(followersData.followers?.length || 0);
            setFollowingCount(followingData.following?.length || 0);

            // Check if current user is in the followers list
            const currentFollows = followersData.followers?.some(
                (f: any) => String(f.follower_id) === String(currentUser?.id)
            );
            setIsFollowing(currentFollows);

        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        const method = isFollowing ? "DELETE" : "POST";
        const res = await fetch(`/api/users/${userId}/follow`, {
            method,
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (res.ok) {
            setIsFollowing(!isFollowing);
            setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        }
    };

    const handleSaveProfile = async () => {
        const res = await fetch(`/api/users/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(editForm),
        });

        if (res.ok) {
            const data = await res.json();
            setProfile(data.user);
            setIsEditing(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("/api/users/me/avatar", {
            method: "POST",
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            setProfile(prev => prev ? { ...prev, avatar_url: data.user.avatar_url } : null);
        } else {
            alert("Failed to upload avatar. Max size is 2MB (JPEG/PNG).");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center text-sm text-[#888]">Loading...</div>;
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#f9f9f7]">
            {/* Navbar */}
            <nav className="sticky top-0 z-10 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/feed" className="text-[#888] hover:text-[#111] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-base font-semibold tracking-tight">@{profile.username}</h1>
                    </div>
                </div>
            </nav>

            <div className="max-w-xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="relative inline-block mb-3 group">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-[#e8e8e8]" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-[#eee] flex items-center justify-center text-xl font-medium text-[#888] border border-[#e8e8e8]">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {isOwnProfile && isEditing && (
                                <div
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="text-white text-[10px] font-medium uppercase tracking-wider">Change</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} />
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-semibold text-[#111]">
                            {profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}` : profile.username}
                        </h2>
                        <p className="text-sm text-[#888]">@{profile.username}</p>
                    </div>

                    {isOwnProfile ? (
                        <button
                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            className="bg-white border border-[#e8e8e8] text-[#111] text-sm px-4 py-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors font-medium"
                        >
                            {isEditing ? "Save Profile" : "Edit Profile"}
                        </button>
                    ) : (
                        <button
                            onClick={handleFollowToggle}
                            className={`text-sm px-5 py-1.5 rounded-lg font-medium transition-colors ${isFollowing
                                ? "bg-white border border-[#e8e8e8] text-[#111] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                : "bg-[#111] text-white hover:bg-[#333]"
                                }`}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    )}
                </div>

                {/* Edit Form OR Bio/Details */}
                {isEditing ? (
                    <div className="space-y-3 mb-6 bg-white border border-[#e8e8e8] p-4 rounded-xl">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="First Name"
                                value={editForm.first_name}
                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm outline-none"
                            />
                            <input
                                placeholder="Last Name"
                                value={editForm.last_name}
                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm outline-none"
                            />
                        </div>
                        <textarea
                            placeholder="Bio (Max 160 chars)"
                            value={editForm.bio}
                            onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                            maxLength={160}
                            className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm outline-none resize-none h-20"
                        />
                        <input
                            placeholder="Website"
                            value={editForm.website}
                            onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                            className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm outline-none"
                        />
                        <input
                            placeholder="Location"
                            value={editForm.location}
                            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm outline-none"
                        />
                    </div>
                ) : (
                    <div className="mb-6 space-y-2">
                        {profile.bio && <p className="text-sm text-[#333]">{profile.bio}</p>}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#888]">
                            {profile.location && (
                                <span className="flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {profile.location}
                                </span>
                            )}
                            {profile.website && (
                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    {profile.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                            <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-y border-[#e8e8e8] mb-6">
                    <div className="text-sm">
                        <span className="font-semibold text-[#111] mr-1">{profile.posts_count}</span>
                        <span className="text-[#888]">Posts</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-[#111] mr-1">{followersCount}</span>
                        <span className="text-[#888]">Followers</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-[#111] mr-1">{followingCount}</span>
                        <span className="text-[#888]">Following</span>
                    </div>
                </div>

                {/* NOTE: You can map and fetch user-specific posts here if you filter the global feed */}
                <div className="text-center text-sm text-[#888] py-8">
                    View posts in the <Link href="/feed" className="text-[#111] underline hover:no-underline">global feed</Link>.
                </div>
            </div>
        </div>
    );
}