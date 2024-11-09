'use client';

import * as faceapi from 'face-api.js';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // ShadCN Button
import { Input } from '@/components/ui/input'; // ShadCN Input
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {toast} from "@/hooks/use-toast";
import {router} from "next/client";

function Enroll() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [enrolledFaces, setEnrolledFaces] = useState([]);
  const [authenticationStatus, setAuthenticationStatus] = React.useState(false);
  const [name, setName] = useState('');
  const videoRef = useRef();
  const canvasRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const router = useRouter();

  useEffect(() => {
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
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = '';
        canvasRef.current.appendChild(faceapi.createCanvasFromMedia(videoRef.current));
        const displaySize = { width: videoWidth, height: videoHeight };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        if (modelsLoaded) {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvasRef.current
              .getContext('2d')
              .clearRect(0, 0, videoWidth, videoHeight);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        } else {
          console.log('Models are still loading...');
        }
      }
    }, 100);
  };

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  };

    const enroll = async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        if (detections.length === 0) {
            toast({description: 'No face detected'});
            return;
        }
        if (name === '') {
            toast({description: 'Please enter a name for the face'});
            return;
        }
        if (enrolledFaces.find((face) => face.name === name)) {
            toast({description: 'Name already exists'});
            return;
        }
        setEnrolledFaces([...enrolledFaces, { name, descriptors: detections[0].descriptor }]);
        setName('');
        toast({description: 'Face enrolled successfully'});
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('enrolledFaces', JSON.stringify([...enrolledFaces, { name, descriptors: detections[0].descriptor }]));
        }
    }

    const authenticate = async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        if (detections.length === 0) {
            toast({description: 'No face detected'});
            return;
        }
        if (enrolledFaces.length === 0) {
            toast({description: 'No faces enrolled'});
            return;
        }
        const faceMatcher = new faceapi.FaceMatcher(enrolledFaces.map((face) => new faceapi.LabeledFaceDescriptors(face.name, [face.descriptors])));
        const match = faceMatcher.findBestMatch(detections[0].descriptor);
        if (match.label === 'unknown') {
            toast({description: 'Face not recognized'});
        } else if (match.distance < 0.35) {
            toast({description: `Welcome ${match.label}`});
            setAuthenticationStatus(true);
            router.push('../demo');
            closeWebcam();
        } else {
            toast({description: 'Face not recognized'});
        }
    }

  return (
      <div className="w-screen h-screen bg-slate-600 justify-center align-middle items-center">
        <div className="flex w-screen justify-center gap-x-2 items-center p-4">
          <div className="space-y-4 space-x-2">
            {/* Name Input for labeling the face */}
            <Input
                type="text"
                placeholder="Enter name for person"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 rounded-lg"
            />

            {/* Webcam Control Buttons */}
            {captureVideo && modelsLoaded ? (
                <Button onClick={closeWebcam} variant="secondary">
                  Close Webcam
                </Button>
            ) : (
                <Button onClick={startVideo}>Open Webcam</Button>
            )}

            <Button onClick={enroll}>Enroll Face</Button>
            <Button onClick={authenticate}>Authenticate</Button>
          </div>
        </div>

        {/* Webcam and Canvas */}
        {
          captureVideo ?
              modelsLoaded ?
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                      <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                    </div>
                  </div> : <div>loading...</div>
              : <></>
        }
      </div>
  );
}

export default Enroll;
