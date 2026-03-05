# Family App Backend

## Demo account

To create a demo account with 2 families, ~25–30 person topology each, filled feed/chat, and pending join requests:

```bash
python manage.py create_demo_account
```

**Default login:** `demo` / `Demo123!` (email: `demo@example.com`).

To remove the demo user and related data and start over:

```bash
python manage.py create_demo_account --reset
```

Optional: `--username`, `--email`, `--password` to override defaults.
