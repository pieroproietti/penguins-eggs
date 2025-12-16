import os
import json
import subprocess
from flask import Flask, request, Response, jsonify, send_from_directory # FIX: Added send_from_directory
from flask_cors import CORS
import time

# --- Configuration ---
app = Flask(__name__)
CORS(app)
PORT = 5000

# Define the absolute path to the directory containing this script for serving index.html
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Core Logic for Command Execution (Using os.system for reliability) ---

def stream_command_output(command, task_name="Task"):
    """
    Executes a shell command using os.system() (blocks terminal).
    Output is NOT streamed to the web UI; it is printed to the server console.
    """

    # 1. Log command start
    print(f"\n[TASK START: {task_name}] Executing command: {command}")
    yield json.dumps({"type": "stdout", "message": f"[SYSTEM] Executing: {command}"}) + '\n'
    yield json.dumps({"type": "stderr", "message": "NOTE: Output is being shown ONLY on the server terminal."}) + '\n'

    try:
        # EXECUTE COMMAND DIRECTLY: Blocks the current Python thread until finished.
        exit_code = os.system(command)

        # 2. Log command finish
        print(f"[TASK FINISHED: {task_name}] Command finished with code {exit_code}\n")
        yield json.dumps({"type": "stdout", "message": f"Command finished successfully on server console."}) + '\n'
        yield json.dumps({"type": "exit", "code": exit_code}) + '\n'

    except Exception as e:
        yield json.dumps({"type": "stderr", "message": f"CRITICAL BACKEND ERROR: {str(e)}"}) + '\n'
        yield json.dumps({"type": "exit", "code": 1}) + '\n'


# --- API ENDPOINTS ---

@app.route('/')
def serve_index():
    """Serves the main index.html file from the BASE_DIR."""
    # This now works because send_from_directory is imported!
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/api/dad/stream', methods=['POST'])
def eggs_dad_stream():
    """Runs 'sudo eggs dad --script' for configuration reset."""
    command = "sudo eggs dad --script"
    return Response(stream_command_output(command, "Config Reset"), mimetype='application/json')


@app.route('/api/produce/stream', methods=['POST'])
def produce_iso_stream():
    """Runs 'sudo eggs produce' with selected options."""
    data = request.json

    # ISO name is MANDATORY for produce
    iso_name = data.get('isoName', 'custom.iso')
    mode = data.get('mode', '')
    exclude_data = data.get('excludeData', '')

    command_parts = [
        "sudo eggs produce",
        f"--basename={iso_name}",
        "--script"
    ]

    if mode:
        command_parts.append(mode)
    if exclude_data:
        command_parts.append(exclude_data)

    final_command = " ".join(command_parts)

    return Response(stream_command_output(final_command, "ISO Creation"), mimetype='application/json')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Python Flask Backend is running"})

# --- Main Run ---
if __name__ == '__main__':
    # ... (print statements remain the same) ...
    app.run(host='0.0.0.0', port=PORT, debug=False)
