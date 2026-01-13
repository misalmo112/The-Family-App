"""
Django management command to create a superadmin user.

Usage:
    python manage.py createsuperadmin
    python manage.py createsuperadmin --username admin --email admin@example.com
    python manage.py createsuperadmin --username admin --email admin@example.com --no-input
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superadmin user with is_superadmin=True'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username for the superadmin',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the superadmin',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the superadmin (if not provided, will be prompted)',
        )
        parser.add_argument(
            '--no-input',
            action='store_true',
            help='Run in non-interactive mode (requires --username, --email, and --password)',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        email = options.get('email')
        password = options.get('password')
        no_input = options.get('no_input', False)

        # Interactive mode
        if not no_input:
            if not username:
                username = input('Username: ').strip()
            if not username:
                raise CommandError('Username is required.')

            if not email:
                email = input('Email address: ').strip()
            if not email:
                raise CommandError('Email is required.')

            if not password:
                password = self._get_password()

        # Non-interactive mode - validate required fields
        else:
            if not username:
                raise CommandError('--username is required in non-interactive mode.')
            if not email:
                raise CommandError('--email is required in non-interactive mode.')
            if not password:
                raise CommandError('--password is required in non-interactive mode.')

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            raise CommandError(f'User "{username}" already exists.')

        # Create the superadmin user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_superadmin=True,
                is_staff=True,  # Also needed for Django admin access
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superadmin user "{username}" with ID {user.id}'
                )
            )
        except IntegrityError as e:
            raise CommandError(f'Error creating user: {e}')
        except Exception as e:
            raise CommandError(f'Unexpected error: {e}')

    def _get_password(self):
        """Get password from user input with confirmation."""
        from getpass import getpass

        password = getpass('Password: ')
        if not password:
            raise CommandError('Password cannot be empty.')

        password_confirm = getpass('Password (again): ')
        if password != password_confirm:
            raise CommandError('Passwords do not match.')

        return password
