import { runPythonScript } from '../../utils/runPythonScript'; // Adjust path as necessary
import { NextResponse } from 'next/server'; // Recommended for returning JSON
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);


export async function GET(req: Request) {
  try {
    // Example: Read arguments from the request body/query if needed
    const { searchParams } = new URL(req.url);
    const player = 'Stephen Curry'
    const season = '2025-26'
    const regSeason = '2025-2026'

    console.log(`Reg: ${JSON.stringify(regSeason)}`)
    console.log(`Trimmed: ${JSON.stringify(season)}`)
    
    // Define the path to your script (relative to the project root)
    const SCRIPT_PATH = 'scripts/get_nba_stats.py'; 
    
    // 💡 The most common way to pass inputs is via arguments (Method 1)
    const args = [player || 'Stephen Curry', season || '2025-26'];
    
    //const result = await runPythonScript(SCRIPT_PATH, args);
    const command = `python3 ${SCRIPT_PATH} "${player}" ${season}`;
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      // Log any non-fatal errors printed to stderr by Python
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    console.log("Resulttt " + JSON.stringify(result.data[0]));


    // Send the data returned by the Python script back in the API response
    // res.status(200).json({ 
    //   message: 'Script ran successfully',
    //   data: result.output // This is the data the Python script printed
    // });

  return NextResponse.json(result.data[0], { status: 200 });

  } catch (error) {
    // console.error('API Handler Error:', error.message);
    // res.status(500).json({ error: error.message || 'Internal server error' });
    return NextResponse.json(error, { status: 500 });
  }
}