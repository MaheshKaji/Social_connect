"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser } from "@/lib/auth-client";

interface Post {
    id: string;
    content: string;
    image_url: string | null;
    like_count: number;
    comment_count: number;
    created_at: string;
    author_id: string;
}

interface Comment {
    id: string;
    content: string;
    user_id: string;
    post_id: string;
    created_at: string;
}

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.postId as string;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [commenting, setCommenting] = useState(false);

    const currentUser = getUser();

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
            return;
        }
        fetchPostAndComments();
    }, [postId]);

    const fetchPostAndComments = async () => {
        try {
            const [postRes, commentsRes] = await Promise.all([
                fetch(`/api/posts/${postId}`),
                fetch(`/api/posts/${postId}/comments`)
            ]);

            if (!postRes.ok) {
                router.push("/feed");
                return;
            }

            const postData = await postRes.json();
            const commentsData = await commentsRes.json();

            setPost(postData.post);
            setComments(commentsData || []);
        } catch (error) {
            console.error("Failed to fetch post details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setCommenting(true);

        const res = await fetch(`/api/posts/${postId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ content: newComment }),
        });

        if (res.ok) {
            setNewComment("");
            fetchPostAndComments(); // Refresh comments and post comment_count
        }
        setCommenting(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });

        if (res.ok) {
            fetchPostAndComments();
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        const res = await fetch(`/api/posts/${postId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });

        if (res.ok) {
            router.push("/feed");
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return <div className="min-h-screen bg-[#f9f9f7] flex items-center justify-center text-sm text-[#888]">Loading...</div>;
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[#f9f9f7]">
            {/* Navbar */}
            <nav className="sticky top-0 z-10 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-4">
                    <Link href="/feed" className="text-[#888] hover:text-[#111] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-base font-semibold tracking-tight">Post</h1>
                </div>
            </nav>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
                {/* Main Post */}
                <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <Link href={`/profile/${post.author_id}`} className="text-sm font-medium text-[#111] hover:underline">
                            @{post.author_id.slice(0, 8)}
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[#bbb]">{formatDate(post.created_at)}</span>
                            {currentUser?.id === post.author_id && (
                                <button onClick={handleDeletePost} className="text-xs text-red-500 hover:underline">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {post.image_url && (
                        <img src={post.image_url} alt="Post image" className="mt-4 rounded-lg w-full object-cover max-h-96" />
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#f0f0f0]">
                        <div className="flex items-center gap-1.5 text-xs text-[#888]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {post.like_count} Likes
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#888]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {post.comment_count} Comments
                        </div>
                    </div>
                </div>

                {/* Add Comment */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        className="flex-1 text-sm border border-[#e8e8e8] rounded-lg px-3 py-2 outline-none focus:border-[#111] transition-colors bg-white"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={commenting || !newComment.trim()}
                        className="bg-[#111] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40"
                    >
                        Post
                    </button>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3 px-4 flex justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Link href={`/profile/${comment.user_id}`} className="text-xs font-medium text-[#111] hover:underline">
                                        @{comment.user_id.slice(0, 8)}
                                    </Link>
                                    <span className="text-[10px] text-[#bbb]">{formatDate(comment.created_at)}</span>
                                </div>
                                <p className="text-sm text-[#444]">{comment.content}</p>
                            </div>

                            {currentUser?.id === comment.user_id && (
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-[#bbb] hover:text-red-500 self-start mt-1 transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-sm text-[#888] pt-4">No comments yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}