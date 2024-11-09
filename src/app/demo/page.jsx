'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from "next/link";

const Demo = () => {
    const [user, setUser] = useState("loading...");
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = sessionStorage.getItem('user');
            setUser(storedUser || "Anonymous");
        }
    }, []);

    const handleVoteClick = () => {
        router.push("/vote");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800 p-6 relative">
            {/* App Name in the Corner */}
            <div className="absolute top-6 left-6 text-xl font-semibold text-gray-600">
                Athens
            </div>

            {/* Centered Modal */}
            <div className="max-w-md w-full text-center space-y-6 p-10 bg-white rounded-lg shadow-lg border border-gray-200">
                <h1 className="text-4xl font-semibold text-gray-800">
                    Welcome, {user}!
                </h1>
                <p className="text-md text-gray-500">
                    You are now part of a decentralized voting system powered by blockchain technology.
                </p>
                <p className="text-sm text-gray-400">
                    Your participation in this voting process is secure, transparent, and private.
                </p>

                {/* Loading Indicator */}
                {user === "loading..." && (
                    <div className="flex justify-center mt-4">
                        <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
                    </div>
                )}

                {/* Voting Button */}
                {user && user !== "loading..." && (
                    <Button
                        asChild
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-md font-medium"
                    >
                        <Link href={'../vote'}>Vote now</Link>
                    </Button>
                )}

                {/* Informational Alert */}
                <Alert type="info" className="mt-6 bg-gray-50 border border-gray-300 text-gray-600 rounded-lg">
                    Decentralized Voting ensures your voice is heard with complete transparency and security. Every vote is immutable!
                </Alert>
            </div>
        </div>
    );
};

export default Demo;
