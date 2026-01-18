#!/usr/bin/env python
"""
Direct server startup script to bypass Windows autoreloader issues.
This script starts the Django development server without the autoreloader.
"""
import os
import sys

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import django
    django.setup()
    
    from django.core.management import execute_from_command_line
    from django.core.management.commands.runserver import Command as RunserverCommand
    
    print("=" * 60)
    print("Starting Django Development Server")
    print("=" * 60)
    print(f"Python: {sys.version}")
    print(f"Django: {django.get_version()}")
    print(f"Settings: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print("=" * 60)
    print()
    
    # Create a custom runserver command instance
    # Use --noreload to disable autoreloader
    # Use 127.0.0.1:8000 explicitly
    sys.argv = ['manage.py', 'runserver', '127.0.0.1:8000', '--noreload']
    
    print("Starting server on http://127.0.0.1:8000/")
    print("Press CTRL+C to stop the server")
    print()
    
    execute_from_command_line(sys.argv)
    
except KeyboardInterrupt:
    print("\n\nServer stopped by user.")
    sys.exit(0)
except Exception as e:
    print(f"\n[ERROR] Failed to start server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
