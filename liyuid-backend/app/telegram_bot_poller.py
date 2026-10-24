from app.integrations.telegram import send_message
from app.integrations.telegram_bot_poller import run_poller

__all__ = ["send_message", "run_poller"]

if __name__ == "__main__":
    run_poller()
