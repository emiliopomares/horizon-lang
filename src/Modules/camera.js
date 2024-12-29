import cv from 'opencv4nodejs';

// Open the default webcam (0 is the default camera, use 1 for another camera)
const wCap = new cv.VideoCapture(0);

// Set the width and height of the video capture frame to 320x240
wCap.set(cv.CAP_PROP_FRAME_WIDTH, 320);
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 240);

// Create a window to display the video stream
const win = new cv.imshow('Webcam Stream', wCap.read());

// Function to calculate the maximum value across RGB channels
function calculateMaxRGB(frame) {
  // Split the frame into individual channels (Blue, Green, Red)
  const channels = frame.split();

  // Find the maximum pixel value in each channel
  const maxBlue = channels[0].minMaxLoc().maxVal;
  const maxGreen = channels[1].minMaxLoc().maxVal;
  const maxRed = channels[2].minMaxLoc().maxVal;

  // Return the maximum value across the RGB channels
  return Math.max(maxBlue, maxGreen, maxRed);
}

// Function to capture and process the video frames
function processVideo() {
  const frame = wCap.read(); // Capture a frame from the webcam

  // Check if the frame is empty, exit if it is
  if (frame.empty) {
    console.log('No more frames available.');
    return;
  }

  // Calculate the maximum pixel value across the RGB channels
  const maxRGB = calculateMaxRGB(frame);

  // Log the maximum value
  console.log('Max RGB Value in the current frame:', maxRGB);

  // Show the current frame in a window
  cv.imshow('Webcam Stream', frame);

  // Delay for a short period to allow the window update
  cv.waitKey(1); // 1 ms delay for real-time processing

  // Call processVideo again for the next frame
  setImmediate(processVideo);
}

// Start processing video frames
processVideo();
