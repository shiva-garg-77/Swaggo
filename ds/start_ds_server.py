#!/usr/bin/env python3
"""
Startup script for the Swaggo Data Science Server
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], cwd=os.path.dirname(os.path.abspath(__file__)))
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_backend_server():
    """Check if the main website backend is running"""
    try:
        response = requests.get("http://localhost:4000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Website backend server is running")
            return True
    except requests.exceptions.RequestException:
        pass
    
    print("⚠️ Website backend server not detected at localhost:4000")
    print("   The data science server will run independently")
    return False

def check_frontend_server():
    """Check if the frontend is running"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Website frontend server is running")
            return True
    except requests.exceptions.RequestException:
        pass
    
    print("⚠️ Website frontend server not detected at localhost:3000")
    return False

def start_server():
    """Start the data science server"""
    print("🚀 Starting Swaggo Data Science Server...")
    
    # Set environment variables
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'
    
    # Start the Flask app
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except ImportError as e:
        print(f"❌ Failed to import app: {e}")
        print("Make sure all dependencies are installed")
        return False
    except Exception as e:
        print(f"❌ Server startup failed: {e}")
        return False

def main():
    """Main startup function"""
    print("=" * 50)
    print("🔬 Swaggo Data Science Server Startup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    print("\\nChecking dependencies...")
    if not install_dependencies():
        response = input("\\n❓ Continue without installing dependencies? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Check if other servers are running
    print("\\nChecking related services...")
    backend_running = check_backend_server()
    frontend_running = check_frontend_server()
    
    # Show integration status
    if backend_running and frontend_running:
        print("\\n🌐 Full integration mode: Data Science + Website + Frontend")
    elif backend_running:
        print("\\n🔧 Backend integration mode: Data Science + Website Backend")
    else:
        print("\\n⚡ Standalone mode: Data Science Server only")
    
    # Start server
    print("\\n" + "=" * 50)
    try:
        start_server()
    except KeyboardInterrupt:
        print("\\n\\n⏹️ Server stopped by user")
        print("👋 Thanks for using Swaggo Data Science Server!")
    except Exception as e:
        print(f"\\n\\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
