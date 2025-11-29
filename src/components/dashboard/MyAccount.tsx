import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface MyAccountProps {
    slug: string;
    displayName: string;
    email?: string;
}

export function MyAccount({ slug, displayName, email }: MyAccountProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteAccount = useAction(api.creators.deleteAccountAction);
    const { signOut } = useClerk();
    const router = useRouter();

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount({ slug });
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Failed to delete account:", error);
            setIsDeleting(false);
            // Ideally show an error toast here
        }
    };

    return (
        <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl uppercase font-bold font-display text-gray-900 border-b pb-2 border-gray-subtle">My Account</h2>
                <p className="text-gray-600">Manage your account settings and preferences.</p>
            </div>

            <div className="bg-greenlite p-6  border border-gray-200  flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-">
                    <div className="flex flex-col gap-1 mb-2">
                        <label className="text-sm font-medium text-gray-500">Display Name</label>
                        <p className="text-gray-900 font-medium">{displayName}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-500">Username / Slug</label>
                        <p className="text-gray-900 font-medium">@{slug}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 font-medium">{email || "Not provided"}</p>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 p-6  border border-red-100 flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Danger Zone</h3>
                <p className="text-red-700 text-sm">
                    Once you delete your account, there is no going back. Please be certain.
                    All your queues, tickets, and settings will be permanently removed.
                </p>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="self-start uppercase px-4 py-1 bg-text text-coral hover:text-bg text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    Cancel Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg max-w-md w-full p-6 transform transition-all">
                        <h3 className="text-xl font-bold text-coral mb-2">Delete Account?</h3>
                        <p className="text-text mb-6">
                            Are you absolutely sure? This action cannot be undone. This will permanently delete your account
                            <strong> @{slug}</strong> and remove your data from our servers.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-greenlite text-gray-700 font-medium hover:bg-gray-100  transition-colors"
                            >
                                Keep Account
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-text text-coral font-medium  hover:bg-red-700 hover:text-bg transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white  animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Yes, Delete My Account"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
