import mic from 'mic';
import fs from 'fs';

// Set up the microphone input options
const micInstance = mic({
  rate: '16000',
  channels: '1',
  debug: false,
  exitOnSilence: 6,
  bufferSize: 256
});

const micInputStream = micInstance.getAudioStream();

// Start recording
micInstance.start();

function estimateIntensity(chunk) {
    // Convert the Buffer chunk to an array of 16-bit signed integers
    const audioData = new Int16Array(chunk.buffer);
  
    // Find the maximum absolute value in the array
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
  
    // Return the maximum amplitude, which can be considered as intensity
    return maxAmplitude;
}

micInputStream.on('data', (data) => {
  console.log('Received audio chunk:', data);
  const intensity = estimateIntensity(data);
  console.log('Estimated Intensity (Max Amplitude):', intensity);
});

// Stop recording after 10 seconds (for example)
setTimeout(() => {
  micInstance.stop();
  console.log('Recording stopped.');
}, 10000);
