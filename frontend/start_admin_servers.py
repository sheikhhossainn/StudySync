#!/usr/bin/env python3
"""
StudySync Admin Server Setup
Runs main site on port 3000 and admin portal on port 8080
"""

import http.server
import socketserver
import threading
import webbrowser
import os
import time
from pathlib import Path

# Server configuration
MAIN_PORT = 3000
ADMIN_PORT = 8080
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for serving files"""
    
    def __init__(self, *args, directory=None, **kwargs):
        if directory is None:
            directory = os.getcwd()
        self.directory = directory
        super().__init__(*args, directory=directory, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def start_server(port, name, open_path=None):
    """Start a server on the specified port"""
    try:
        handler = CustomHTTPRequestHandler
        with socketserver.TCPServer((HOST, port), handler) as httpd:
            print(f"✅ {name} server started at http://{HOST}:{port}")
            if open_path:
                print(f"   Opening: http://{HOST}:{port}{open_path}")
            
            # Open browser after a short delay
            if open_path:
                def open_browser():
                    time.sleep(2)
                    webbrowser.open(f"http://{HOST}:{port}{open_path}")
                
                browser_thread = threading.Thread(target=open_browser)
                browser_thread.daemon = True
                browser_thread.start()
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Address already in use
            print(f"❌ Port {port} is already in use for {name}")
        else:
            print(f"❌ Error starting {name} server: {e}")
    except KeyboardInterrupt:
        print(f"\n⏹️ {name} server stopped")

def main():
    """Main function to start both servers"""
    print("=" * 50)
    print("    StudySync Admin Server Setup")
    print("=" * 50)
    print()
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    if not (current_dir / "index.html").exists():
        print("❌ Error: Please run this script from the frontend directory")
        print(f"   Current directory: {current_dir}")
        print("   Expected files: index.html, admin-portal.html")
        return
    
    print("📁 Serving files from:", current_dir)
    print()
    
    # Start main site server in a separate thread
    main_thread = threading.Thread(
        target=start_server, 
        args=(MAIN_PORT, "Main Site", "/index.html"),
        daemon=True
    )
    main_thread.start()
    
    # Wait a moment before starting admin server
    time.sleep(1)
    
    # Start admin server in a separate thread  
    admin_thread = threading.Thread(
        target=start_server,
        args=(ADMIN_PORT, "Admin Portal", "/admin-portal.html"),
        daemon=True
    )
    admin_thread.start()
    
    # Wait a moment for servers to start
    time.sleep(2)
    
    print()
    print("=" * 50)
    print("    Servers Started Successfully!")
    print("=" * 50)
    print()
    print(f"🌐 Main Site:     http://{HOST}:{MAIN_PORT}")
    print(f"🔐 Admin Portal:  http://{HOST}:{ADMIN_PORT}")
    print()
    print("🔑 Admin Access Codes:")
    print("   • ADMIN2024SS  (Super Admin)")
    print("   • MANAGER2024  (Manager)")
    print("   • DEVTEST123   (Developer)")
    print("   • STUDYSYNC24  (Standard Admin)")
    print()
    print("📱 Both sites are mobile-friendly and responsive")
    print()
    print("⏹️  Press Ctrl+C to stop all servers")
    print("=" * 50)
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n" + "=" * 50)
        print("⏹️  Stopping all servers...")
        print("=" * 50)
        print("✅ All servers stopped successfully!")
        print("👋 Thank you for using StudySync Admin Portal!")

if __name__ == "__main__":
    main()
