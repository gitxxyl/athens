'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    CheckCircle2,
    ShieldCheck,
    UserCircle,
    Vote,
    AlertCircle,
    Loader2
} from "lucide-react";

const candidates = [
    {
        id: 1,
        name: "Sarah Johnson",
        party: "Progressive Party",
        position: "City Council"
    },
    {
        id: 2,
        name: "Michael Chen",
        party: "Citizens Alliance",
        position: "City Council"
    },
    {
        id: 3,
        name: "Elena Rodriguez",
        party: "Community First",
        position: "City Council"
    }
];

const VotingPage = () => {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVoteComplete, setIsVoteComplete] = useState(false);
    const [error, setError] = useState('');

    const handleVoteSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            // Simulate API call to submit vote
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success state
            setIsVoteComplete(true);
            setShowConfirmDialog(false);
        } catch (err) {
            setError('An error occurred while submitting your vote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVoteComplete) {
        return (
            <div className="w-screen h-screen bg-slate-100 grid place-items-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-semibold">Vote Submitted Successfully</h2>
                            <p className="text-slate-600">
                                Your vote has been securely recorded. Thank you for participating in the election.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Vote ID: {Math.random().toString(36).substr(2, 9)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-slate-100 grid place-items-center p-4">
            <div className="w-full max-w-2xl space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Vote className="w-5 h-5 text-blue-600" />
                            <CardTitle>Cast Your Vote</CardTitle>
                        </div>
                        <CardDescription>
                            Select your preferred candidate for the City Council position
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <RadioGroup
                            className="space-y-4"
                            value={selectedCandidate?.toString()}
                            onValueChange={(value) => setSelectedCandidate(parseInt(value))}
                        >
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className={`flex items-center space-x-2 border rounded-lg p-4 transition-colors ${
                                        selectedCandidate === candidate.id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <RadioGroupItem
                                        value={candidate.id.toString()}
                                        id={`candidate-${candidate.id}`}
                                        className="data-[state=checked]:border-blue-600"
                                    />
                                    <Label
                                        htmlFor={`candidate-${candidate.id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-slate-100 p-2">
                                                <UserCircle className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{candidate.name}</div>
                                                <div className="text-sm text-slate-500">
                                                    {candidate.party}
                                                </div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedCandidate}
                    onClick={() => setShowConfirmDialog(true)}
                >
                    Submit Vote
                </Button>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to cast your vote for{' '}
                                <span className="font-medium">
                  {candidates.find(c => c.id === selectedCandidate)?.name}
                </span>
                                . This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleVoteSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Confirm Vote
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default VotingPage;