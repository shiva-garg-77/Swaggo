"use client";

import { useAuth } from '../Helper/AuthProvider';

export default function AuthTest() {
    const { user, accessToken } = useAuth();

    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-bold mb-2">Auth Status:</h3>
            <div className="space-y-2">
                <p><strong>Token:</strong> {accessToken ? "Present" : "Not present"}</p>
                <p><strong>User:</strong> {user ? "Logged in" : "Not logged in"}</p>
                {user && (
                    <div className="ml-4">
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Profile ID:</strong> {user.profileid || "Not available"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
