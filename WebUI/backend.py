# to run on Debian trixie:
# sudo apt install python3-flask python3-flask-cors
# sudo python3 backend.py
# open browser at: http://127.0.0.1:5000

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
    return Response(stream_command_output("sudo eggs dad --script", "Config Reset"), mimetype='application/json')

@app.route('/api/produce/stream', methods=['POST'])
def produce_iso_stream():
    data = request.json
    iso_name = data.get('isoName', 'live-image.iso')
    mode = data.get('mode', '')
    exclude_data = data.get('excludeData', '')

    parts = ["sudo eggs produce", f"--basename={iso_name}", "--script"]
    if mode: parts.append(mode)
    if exclude_data: parts.append(exclude_data)

    return Response(stream_command_output(" ".join(parts), "ISO Creation"), mimetype='application/json')

@app.route('/api/calamares', methods=['POST'])
def calamares_action():
    data = request.json
    action = data.get('action', 'install')
    theme = data.get('theme', '')

    if action == 'theme':
        # sudo eggs calamares --theme=/path
        if not theme: return jsonify({"error": "No theme path provided"}), 400
        cmd = f"sudo eggs calamares --theme={theme}"
        task = "Set Calamares Theme"
    elif action == 'remove':
        cmd = "sudo eggs calamares --remove"
        task = "Remove Calamares"
    else:
        cmd = "sudo eggs calamares --install"
        task = "Install Calamares"

    return Response(stream_command_output(cmd, task), mimetype='application/json')

@app.route('/api/kill', methods=['POST'])
def kill_isos():
    return Response(stream_command_output("sudo eggs kill -n", "Delete All ISOs"), mimetype='application/json')

@app.route('/api/pods', methods=['POST'])
def build_pod():
    distro = request.json.get('distro', 'archlinux')
    return Response(stream_command_output(f"sudo eggs pods {distro}", f"Pod Build: {distro}"), mimetype='application/json')

@app.route('/api/cuckoo', methods=['POST'])
def run_cuckoo():
    """Starts PXE Host (Cuckoo)"""
    return Response(stream_command_output("sudo eggs cuckoo", "PXE Host (Cuckoo)"), mimetype='application/json')

@app.route('/api/yolk', methods=['POST'])
def run_yolk():
    """Configures Eggs for offline use"""
    return Response(stream_command_output("sudo eggs tools yolk", "Yolk (Offline Mode)"), mimetype='application/json')

@app.route('/api/wardrobe', methods=['POST'])
def run_wardrobe():
    """Wear a costume from wardrobe"""
    data = request.json
    repo = data.get('repo', '')
    no_acc = data.get('no_accessories', False)
    no_firm = data.get('no_firmwares', False)
    wardrobe_path = data.get('wardrobe_path', '')

    if not repo:
        return jsonify({"error": "No repository specified"}), 400

    parts = ["sudo eggs wardrobe wear", repo]

    if no_acc: parts.append("--no_accessories")
    if no_firm: parts.append("--no_firmwares")
    if wardrobe_path: parts.append(f"--wardrobe={wardrobe_path}")

    cmd = " ".join(parts)
    return Response(stream_command_output(cmd, f"Wardrobe: {repo}"), mimetype='application/json')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False)
