'use client';

import * as faceapi from 'face-api.js';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // ShadCN Button
import { Input } from '@/components/ui/input'; // ShadCN Input
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";

function FaceLogin() {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);
    const [enrolledFaces, setEnrolledFaces] = useState([]);
    const [authenticationStatus, setAuthenticationStatus] = useState(false);
    const videoRef = useRef();
    const canvasRef = useRef();
    const videoHeight = 480;
    const videoWidth = 640;
    const router = useRouter();
    const [timeoutReached, setTimeoutReached] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('enrolledFaces')) {
                const data = JSON.parse(sessionStorage.getItem('enrolledFaces'));
                data.forEach((face) => {
                    const desc = Array();
                    for (let i = 0; i < 128; i++) {
                        desc.push(new Float32Array([face.descriptors[i]]));
                    }
                    face = {
                        name: face.name,
                        descriptors: desc,
                    }
                });
                setEnrolledFaces(data);
            }
        }

        const loadModels = async () => {
            const MODEL_URL = '/models';

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
        };
        loadModels().then(() => console.log('Models loaded'));
    }, []);

    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({ video: { width: 300 } })
            .then((stream) => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch((err) => {
                console.error('Error opening video stream:', err);
            });
    };

    const handleVideoOnPlay = () => {
        // Interval for face detection and authentication attempt
        const interval = setInterval(async () => {
            if (canvasRef && canvasRef.current) {
                canvasRef.current.innerHTML = '';
                canvasRef.current.appendChild(faceapi.createCanvasFromMedia(videoRef.current));
                const displaySize = { width: videoWidth, height: videoHeight };

                faceapi.matchDimensions(canvasRef.current, displaySize);

                if (modelsLoaded) {
                    const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    if (canvasRef.current) { canvasRef.current
                        .getContext('2d')
                        .clearRect(0, 0, videoWidth, videoHeight);
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetections); }

                    // Try to authenticate the face every interval
                    if (detections.length > 0) {
                        if (authenticationStatus) {
                            clearInterval(interval);
                            closeWebcam();
                        }
                        await authenticate();
                    }
                } else {
                    console.log('Models are still loading...');
                }
            }
        }, 100);

        // Stop the camera after 10 seconds (timeout)
        setTimeout(() => {
            setTimeoutReached(true);
            clearInterval(interval);
            closeWebcam();
            //if (!authenticationStatus) toast({ description: 'Face not recognized', variant: 'destructive'});
        }, 10000);
    };

    const closeWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setCaptureVideo(false);
    };

    const authenticate = async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        if (detections.length === 0 && authenticationStatus === false) {
            toast({ description: 'No face detected' });
            return;
        }
        if (enrolledFaces.length === 0) {
            toast({ description: 'No faces enrolled' });
            return;
        }
        console.log("before: " + typeof enrolledFaces[0].descriptors[0]); //returns number, need to change to Float32Array
        enrolledFaces.forEach((face, index) => {
            let chunkSize = 1;
            let desc = new Float32Array(128);
            for (let i = 0; i < 128; i += chunkSize) {
                desc[i] = face.descriptors[i];
            }

            enrolledFaces[index].descriptors = desc;
        });
        console.log("after: " + typeof [new Float32Array([1])]);
        const faceMatcher = new faceapi.FaceMatcher(enrolledFaces.map((face) => new faceapi.LabeledFaceDescriptors(face.name, [face.descriptors])));
        const match = faceMatcher.findBestMatch(detections[0].descriptor);
        if (match.label === 'unknown') {
            return
        } else if (match.distance < 0.35) {
            setAuthenticationStatus(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('user', match.label);
            }
            closeWebcam(); // Stop the camera if authentication is successful
            router.push('../demo'); // Navigate to the demo page after successful login
        }
    };

    // Start video and face detection once component mounts
    useEffect(() => {
        startVideo();
    }, []);

    return (
        <div className="w-full h-full bg-gray-100 text-gray-800 justify-center items-center">
            <div className="absolute top-6 left-6 font-bold text-xl">
                Athens
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg w-full sm:max-w-md">
                <h1 className="text-3xl font-semibold text-gray-900 text-center mb-6">Face Authentication</h1>
                <div className="relative mb-6">
                    {captureVideo ? (
                        <div className="transition-opacity duration-500 opacity-100">
                            <video
                                ref={videoRef}
                                width={videoWidth}
                                height={videoHeight}
                                onPlay={handleVideoOnPlay}
                                autoPlay
                                muted
                                className="rounded-xl shadow-xl"
                            ></video>
                            <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                        </div>
                    ) : (
                        <div className="flex justify-center items-center">
                            <div className="spinner-border animate-spin text-gray-400" role="status"></div>
                        </div>
                    )}
                </div>

                {timeoutReached && !authenticationStatus && (
                    <p className="text-red-500 text-center">Authentication timed out. Please try again.</p>
                )}

                <div className="mt-6 text-center">
                    <Link href="/enroll" className="text-lg text-indigo-600 hover:text-indigo-500 transition-all duration-200">
                        Don't have an account? Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default FaceLogin;
