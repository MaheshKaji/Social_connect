"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, clearAuth } from "@/lib/auth-client";

interface Post {
    id: string;
    content: string;
    image_url: string | null;
    like_count: number;
    comment_count: number;
    created_at: string;
    author_id: string;
}

export default function FeedPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth state (fixes hydration error)
    const [user, setUser] = useState<{ id: string, username: string } | null>(null);

    // Create post state
    const [content, setContent] = useState("");
    const [posting, setPosting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const currentUser = getUser();
        setUser(currentUser);

        if (!getToken()) {
            router.push("/login");
            return;
        }
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const res = await fetch("/api/feed");
        const data = await res.json();
        setPosts(data.posts || []);
        setLoading(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation before upload
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alert("Only JPEG and PNG images are allowed.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be smaller than 2MB.");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const createPost = async () => {
        if (!content.trim() && !imageFile) return;
        setPosting(true);

        let uploadedImageUrl = null;

        // 1. Upload image if one is selected
        if (imageFile) {
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadRes = await fetch("/api/posts/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });

            if (!uploadRes.ok) {
                alert("Failed to upload image. Please try again.");
                setPosting(false);
                return;
            }

            const uploadData = await uploadRes.json();
            uploadedImageUrl = uploadData.image_url;
        }

        // 2. Create the post with text and optional image URL
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
                content,
                image_url: uploadedImageUrl
            }),
        });

        if (res.ok) {
            setContent("");
            removeImage();
            fetchPosts(); // Refresh feed
        }
        setPosting(false);
    };

    const likePost = async (postId: string) => {
        await fetch(`/api/posts/${postId}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        fetchPosts();
    };

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        clearAuth();
        router.push("/login");
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-[#f9f9f7]">
            {/* Navbar */}
            <nav className="sticky top-0 z-10 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <h1 className="text-base font-semibold tracking-tight">
                        SocialConnect
                    </h1>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                href={`/profile/${user.id}`}
                                className="text-sm text-[#555] hover:text-[#111] transition-colors"
                            >
                                {user.username}
                            </Link>
                        ) : (
                            <div className="w-16 h-4 bg-[#e8e8e8] animate-pulse rounded"></div>
                        )}
                        <button
                            onClick={logout}
                            className="text-sm text-[#888] hover:text-[#111] transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
                {/* Create Post */}
                <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                    <textarea
                        className="w-full text-sm resize-none outline-none placeholder-[#bbb] text-[#111] bg-transparent"
                        placeholder="What's on your mind?"
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={280}
                    />

                    {/* Image Preview Area */}
                    {imagePreview && (
                        <div className="relative mt-2 mb-3 inline-block">
                            <img src={imagePreview} alt="Preview" className="h-32 rounded-lg border border-[#e8e8e8] object-cover" />
                            <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-[#111] text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]">
                        <div className="flex items-center gap-3">
                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                            />
                            {/* Image upload button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[#888] hover:text-[#111] transition-colors"
                                title="Upload Image"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </button>
                            <span className="text-xs text-[#bbb]">
                                {content.length}/280
                            </span>
                        </div>

                        <button
                            onClick={createPost}
                            disabled={posting || (!content.trim() && !imageFile)}
                            className="bg-[#111] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40"
                        >
                            {posting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>

                {/* Posts Feed */}
                {loading ? (
                    <div className="text-center text-sm text-[#888] py-12">
                        Loading feed...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center text-sm text-[#888] py-12">
                        No posts yet. Be the first to post!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white border border-[#e8e8e8] rounded-xl p-4"
                            >
                                {/* Post header */}
                                <div className="flex items-center justify-between mb-3">
                                    <Link
                                        href={`/profile/${post.author_id}`}
                                        className="text-sm font-medium text-[#111] hover:underline"
                                    >
                                        @{post.author_id.slice(0, 8)}
                                    </Link>
                                    <span className="text-xs text-[#bbb]">
                                        {formatDate(post.created_at)}
                                    </span>
                                </div>

                                {/* Post content */}
                                <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                </p>

                                {/* Post image */}
                                {post.image_url && (
                                    <img
                                        src={post.image_url}
                                        alt="Post image"
                                        className="mt-3 rounded-lg w-full object-cover max-h-96 border border-[#f0f0f0]"
                                    />
                                )}

                                {/* Post actions */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f0f0f0]">
                                    <button
                                        onClick={() => likePost(post.id)}
                                        className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        {post.like_count}
                                    </button>

                                    <Link
                                        href={`/posts/${post.id}`}
                                        className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        {post.comment_count}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}