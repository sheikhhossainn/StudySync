#!/usr/bin/env python3
"""
Simple StudySync Admin Server (No Node.js required)
This creates a basic HTTP server using Python's built-in modules
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
from urllib.parse import urlparse, parse_qs

# Configuration
PORT = 3000
HOST = 'localhost'

class StudySyncHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for StudySync admin access"""
    
    def do_GET(self):
        """Handle GET requests with special routing"""
        parsed_path = urlparse(self.path)
        
        # Special admin routes
        if parsed_path.path == '/admin' or parsed_path.path == '/admin/':
            self.path = '/admin-portal.html'
        elif parsed_path.path == '/admin/dashboard':
            self.path = '/admin-dashboard.html'
        elif parsed_path.path == '/admin/direct':
            self.path = '/admin-direct-access.html'
        elif parsed_path.path == '/' or parsed_path.path == '':
            self.path = '/index.html'
            
        # Serve the file
        return super().do_GET()
    
    def end_headers(self):
        """Add CORS headers for local development"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom logging"""
        timestamp = time.strftime('%H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def open_browser_delayed():
    """Open browser after server starts"""
    time.sleep(2)
    print("🌐 Opening browser...")
    
    # Open main site
    webbrowser.open(f'http://{HOST}:{PORT}')
    
    # Wait a moment then open admin portal
    time.sleep(1)
    webbrowser.open(f'http://{HOST}:{PORT}/admin')

def main():
    """Start the StudySync server"""
    print("=" * 60)
    print("    🚀 StudySync Admin Server (Python)")
    print("=" * 60)
    print()
    
    # Check if we're in the right directory
    if not os.path.exists('index.html'):
        print("❌ Error: Please run this script from the frontend directory")
        print("   Expected files: index.html, admin-portal.html")
        print()
        print("💡 To fix this:")
        print('   cd "C:\\Users\\Usha_Personal_Laptop\\Desktop\\Vs all Code\\StudySync\\frontend"')
        print("   python simple_server.py")
        return
    
    print(f"📁 Serving files from: {os.getcwd()}")
    print(f"🌐 Server will start at: http://{HOST}:{PORT}")
    print()
    
    # Start browser opening in background
    browser_thread = threading.Thread(target=open_browser_delayed)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the server
    try:
        with socketserver.TCPServer((HOST, PORT), StudySyncHandler) as httpd:
            print("✅ Server started successfully!")
            print()
            print("🔗 Available URLs:")
            print(f"   Main Site:        http://{HOST}:{PORT}")
            print(f"   Admin Portal:     http://{HOST}:{PORT}/admin")
            print(f"   Admin Dashboard:  http://{HOST}:{PORT}/admin/dashboard")
            print(f"   Direct Access:    http://{HOST}:{PORT}/admin/direct")
            print()
            print("🔑 Admin Access Codes:")
            print("   • ADMIN2024SS  (Super Admin)")
            print("   • MANAGER2024  (Manager)")
            print("   • DEVTEST123   (Developer)")
            print("   • STUDYSYNC24  (Standard Admin)")
            print()
            print("⏹️  Press Ctrl+C to stop the server")
            print("=" * 60)
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print("💡 Try these solutions:")
            print("   1. Close any other web servers running")
            print("   2. Change the PORT variable in this script")
            print("   3. Wait a moment and try again")
        else:
            print(f"❌ Error starting server: {e}")
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("⏹️  Server stopped")
        print("✅ StudySync Admin Server shut down successfully!")
        print("👋 Thank you for using StudySync!")

if __name__ == "__main__":
    main()
