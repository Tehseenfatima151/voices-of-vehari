import sys
import getpass
from app import create_app
from app.extensions import db
from app.models.user import AdminUser
from seed_data import seed_database

app = create_app()

def print_help():
    print("""Voices of Vehari CLI Management Tool
Usage:
  python manage.py init-db      Create all database tables
  python manage.py seed         Seed initial content from original HTML
  python manage.py create-admin Create a new administrator account
""")

def create_admin():
    with app.app_context():
        print("=== Create Admin Account ===")
        username = input("Enter username [admin]: ").strip() or "admin"
        email = input("Enter email [admin@voicesofvehari.edu.pk]: ").strip() or "admin@voicesofvehari.edu.pk"
        password = getpass.getpass("Enter password [AdminPassword2026!]: ").strip() or "AdminPassword2026!"
        full_name = input("Enter full name [Administrator]: ").strip() or "Administrator"

        user = AdminUser.query.filter((AdminUser.username == username) | (AdminUser.email == email)).first()
        if user:
            print(f"User with username '{username}' or email '{email}' already exists. Updating password...")
            user.set_password(password)
            user.full_name = full_name
            db.session.commit()
            print("Password updated successfully!")
            return

        new_user = AdminUser(
            username=username,
            email=email,
            full_name=full_name,
            role='admin'
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        print(f"Admin user '{username}' created successfully!")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print_help()
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == 'init-db':
        with app.app_context():
            db.create_all()
            print("All database tables created successfully.")
    elif cmd == 'seed':
        seed_database()
    elif cmd == 'create-admin':
        create_admin()
    else:
        print(f"Unknown command: {cmd}")
        print_help()
