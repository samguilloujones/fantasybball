import { spawn } from 'child_process';
import path from 'path';

// This function can now be called directly from any server component or API route
export function runPythonScript(scriptPath, args = []) {
  // Return a promise so the calling function can await the result
  return new Promise((resolve, reject) => {
    
    // Ensure you use the absolute path for the Python script
    const absolutePath = path.join(process.cwd(), scriptPath);
    
    // Combine the script path with any provided arguments
    const python = spawn('python3', [absolutePath, ...args]);

    let pythonOutput = '';
    let pythonError = '';

    // Capture standard output (what the Python script prints)
    python.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    // Capture standard error (important for debugging)
    python.stderr.on('data', (data) => {
      pythonError += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        // Reject the promise if the script failed
        const errorDetails = pythonError || `Exited with code ${code}`;
        console.error(`Python script failed: ${errorDetails}`);
        reject(new Error(`Python execution failed: ${errorDetails}`));
      } else {
        // Resolve the promise with the output
        resolve({
          output: pythonOutput.trim(), // Return the collected output
          code: code
        });
      }
    });
    
    python.on('error', (err) => {
      // Handle errors like 'python3' command not found
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

export default async function handler(req, res) {
  // 1. Get input from the client (e.g., query parameters)
  const { name = 'NextJS User' } = req.query; 

  // 2. Define the script path and command
  const scriptPath = './scripts/hello.py';
  
  // Construct the command: python3 script_path "argument_value"
  // python3 is assumed to be installed and available in the execution environment (e.g., Docker/Server).
  // Quoting the argument handles names with spaces.
  const command = `python3 ${scriptPath} "${name}"`;

  try {
    // 3. Execute the Python script
    // The 'stdout' captures the JSON string printed by the Python script
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
        // Log any non-fatal errors or warnings that Python printed to stderr
        console.error('Python STDERR Output:', stderr);
    }
    
    // 4. Parse the JSON output
    // Since the Python script guarantees JSON output to stdout, we parse it directly.
    const pythonResponse = JSON.parse(stdout);

    // 5. Check Python's internal status and respond
    if (pythonResponse.status === 'error') {
      // If the Python script reported an error (like a missing dependency issue)
      return res.status(500).json(pythonResponse);
    }

  } catch (error) {
    // This catches execution errors (e.g., python3 command not found, script file missing)
    console.error('Child Process Execution Error:', error);
    
    // Attempt to parse stdout/stderr if the error object contains them
    let errorMessage = 'Failed to execute Python script.';
    if (error.stderr) {
        errorMessage += ` Details: ${error.stderr.trim()}`;
    }

    res.status(500).json({ 
      status: 'error', 
      message: errorMessage,
      details: error.message 
    });
  }
}