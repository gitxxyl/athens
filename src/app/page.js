'use client';

import { useState } from 'react';
import FaceLogin from "@/components/FaceLogin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChevronRight, UserCircle } from "lucide-react";

const Home = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        nric: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        nric: ''
    });

    const validateStep1 = () => {
        const newErrors = {
            name: '',
            nric: ''
        };

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.nric.trim()) {
            newErrors.nric = 'Last 4 digits of NRIC are required';
        } else if (!/^\d{4}$/.test(formData.nric)) {
            newErrors.nric = 'Please enter exactly 4 digits';
        }

        setErrors(newErrors);
        return !newErrors.name && !newErrors.nric;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setErrors(prev => ({
            ...prev,
            [field]: ''
        }));
    };

    return (
        <div className="w-screen h-screen bg-slate-100 grid place-items-center overflow-hidden px-4">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Progress indicator */}
                <div className="mb-4 flex justify-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                            1
                        </div>
                        <div className="w-16 h-0.5 bg-slate-200">
                            <div className={`h-full bg-blue-600 transition-all ${
                                step === 2 ? 'w-full' : 'w-0'
                            }`} />
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'
                        }`}>
                            2
                        </div>
                    </div>
                </div>

                {step === 1 ? (
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-center">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nric">Last 4 Digits of NRIC</Label>
                                <Input
                                    id="nric"
                                    placeholder="Enter last 4 digits"
                                    maxLength={4}
                                    value={formData.nric}
                                    onChange={(e) => handleInputChange('nric', e.target.value.replace(/\D/g, ''))}
                                />
                                {errors.nric && (
                                    <p className="text-sm text-red-500">{errors.nric}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={handleNext}
                            >
                                Continue to Face Verification
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="w-full space-y-4 flex-col justify-center ">
                        <Card className="w-full">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <UserCircle className="w-5 h-5" />
                                    <span>Verifying: {formData.name}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <div className={'w-screen flex justify-center items-center'}>
                            <FaceLogin />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;