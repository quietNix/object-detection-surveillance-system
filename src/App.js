import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { drawRect } from "./drawRect";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

function App() {
  const [records, setRecords] = useState([]);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const startButtonElement = useRef(null);
  const stopButtonElement = useRef(null);

  const shouldRecordRef = useRef(false);
  const recordingRef = useRef(false);
  const lastDetectionsRef = useRef([]);
  const recorderRef = useRef(null);
  

  let video;
  let foundPerson = false;

  useEffect(() => {
    const runCoco = async () => {
      startButtonElement.current.setAttribute("disabled", true);
      stopButtonElement.current.setAttribute("disabled", true);
       const model = await cocoSsd.load();
      console.log("Handpose model loaded.");
      setInterval(() => {
        detect(model);
      }, 10);
      startButtonElement.current.removeAttribute("disabled");
    };
    runCoco();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  

  const detect = async (model) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      video = webcamRef.current.video;

      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width to webcamref
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await model.detect(video);
      
      if (predictions.length === 0) {
        foundPerson = false;
        return;
      }

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawRect(predictions, ctx);

      predictions.forEach(prediction => {
        if (prediction['class'].toLowerCase() === "person") foundPerson=true;
        else foundPerson=false;
      });

    }
  };



  async function detectFrame() {
    if (!shouldRecordRef.current) {
      stopRecording();
      return;
    }

    if (foundPerson) {
      startRecording();
      lastDetectionsRef.current.push(true);
      console.log("1", foundPerson);
    } else if (lastDetectionsRef.current.filter(Boolean).length) {
      startRecording();
      lastDetectionsRef.current.push(false);
      console.log("2", foundPerson);
    } else {
      stopRecording();
      console.log("3", foundPerson);
    }

    lastDetectionsRef.current = lastDetectionsRef.current.slice(
      Math.max(lastDetectionsRef.current.length - 10, 0)
    );

    requestAnimationFrame(() => {
      detectFrame();
    });
  }

  function startRecording() {
    if (recordingRef.current) return;

    recordingRef.current = true;
    console.log("start recording");

    recorderRef.current = new MediaRecorder(video.captureStream());

    recorderRef.current.ondataavailable = function (e) {
      const title = new Date() + "";
      const href = URL.createObjectURL(e.data);
      setRecords(previousRecords => {
        return [...previousRecords, { href, title }];
      });
    };

    recorderRef.current.start();
  }

  function stopRecording() {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    recorderRef.current.stop();
    console.log("stopped recording");
    lastDetectionsRef.current = [];
  }

  return (
    <div>

      <Webcam
        ref={webcamRef} muted={true}
        style={{
          position: "relative",
          left: "400px"
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: "400px",
        }}
      />

      <div>
        <button
          className="btn btn-success"
          onClick={() => {
            shouldRecordRef.current = true;
            stopButtonElement.current.removeAttribute("disabled");
            startButtonElement.current.setAttribute("disabled", true);
            detectFrame();
          }}
          ref={startButtonElement}>
          Start
            </button>

        <button
          className="btn btn-danger"
          onClick={() => {
            shouldRecordRef.current = false;
            startButtonElement.current.removeAttribute("disabled");
            stopButtonElement.current.setAttribute("disabled", true);
            stopRecording();
          }}
          ref={stopButtonElement}>
          Stop
          </button>

        <h3 >Records:</h3>
        {!records.length
          ? null
          : records.map(record => {
            return (
              <div key={record.title}>
                <h5>{record.title}</h5>
                <video controls src={record.href}></video>
              </div>
            );
          })}

      </div>
    </div>

  );
};

export default App;