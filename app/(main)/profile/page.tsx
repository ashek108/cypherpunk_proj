"use client"
import { useAuth } from "@/lib/providers/AuthProvider";
import { useState, useEffect } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { toast } from "sonner";

export default function ProfilePage(){
    const { user, updateUser, loading } = useAuth();
    const [username, setUsername] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user?.user_metadata?.username) {
            setUsername(user.user_metadata.username);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            toast.error("Username cannot be empty");
            return;
        }
        
        const { success } = await updateUser(username.trim());
        if (success) {
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-600 mb-4">Please sign in to view your profile</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                </div>

                <form onSubmit={handleUpdateProfile}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your username"
                                required
                            />
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-lg text-gray-800">{username || "No username set"}</span>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex gap-3">
                            <SubmitButton 
                                loading={loading} 
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save Changes
                            </SubmitButton>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setUsername(user.user_metadata?.username || "");
                                }}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Account Information</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">User ID:</span> {user.id}</p>
                        <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                        <p><span className="font-medium">Last Sign In:</span> {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}