import * as ort from 'onnxruntime-node';

async function loadAndInspectModel(modelPath) {
    try {
        // Load the ONNX model
        const session = await ort.InferenceSession.create(modelPath);
        console.dir(session);

        // Print the input tensor shapes
        console.log("Model Inputs:");
        session.inputNames.forEach((input) => {
            console.log(`Input Name: ${input.name}`);
            console.log(`Shape: ${input.dims}`);  // Dimensions of the input tensor
            console.log(`Data Type: ${input.type}`);  // Data type of the input tensor
        });

        // Print the output tensor shapes
        console.log("\nModel Outputs:");
        session.outputs.forEach((output) => {
            console.log(`Output Name: ${output.name}`);
            console.log(`Shape: ${output.dims}`);  // Dimensions of the output tensor
            console.log(`Data Type: ${output.type}`);  // Data type of the output tensor
        });
    } catch (error) {
        console.error('Error loading or inspecting the model:', error);
    }
}

// Replace with the path to your ONNX model file
const modelPath = './silero_vad.onnx';

// Run the function to load and inspect the model
loadAndInspectModel(modelPath);