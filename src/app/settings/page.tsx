"use client";

import { Trash2, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { exportUserData, clearAllUserData } from "@/app/actions";

export default function SettingsPage() {
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExport = async () => {
        const data = await exportUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure? This will delete ALL impulses, fasting logs, and stats. This cannot be undone.")) {
            setIsDeleting(true);
            await clearAllUserData();
            setIsDeleting(false);
            alert("All data cleared.");
        }
    };

    return (
        <main className="min-h-screen p-4 bg-background">
            <header className="mb-8 mt-2 flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-gray-400 text-sm">Manage your data.</p>
                </div>
            </header>

            <div className="space-y-4">
                {/* Export */}
                <div className="bg-card rounded-xl p-6 border border-muted">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-zinc-900 rounded-lg text-blue-400">
                            <Download size={24} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Export Data</h2>
                            <p className="text-sm text-gray-500">Download a JSON file of all your logs.</p>
                        </div>
                    </div>

                    {downloadUrl ? (
                        <a
                            href={downloadUrl}
                            download="impulse_tracker_backup.json"
                            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            Click to Download
                        </a>
                    ) : (
                        <button
                            onClick={handleExport}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            Prepare Export
                        </button>
                    )}
                </div>

                {/* Delete */}
                <div className="bg-card rounded-xl p-6 border border-red-900/10 border-muted">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-900/20 rounded-lg text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg text-red-500">Danger Zone</h2>
                            <p className="text-sm text-gray-500">Permanently remove all history.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 font-medium py-3 rounded-lg transition-colors border border-red-900/30"
                    >
                        {isDeleting ? "Deleting..." : "Delete All Data"}
                    </button>
                </div>
            </div>

        </main>
    );
}
