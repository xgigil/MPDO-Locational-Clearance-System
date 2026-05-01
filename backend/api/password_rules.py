import re


PASSWORD_MIN_LENGTH = 12


def validate_password_rules(password: str) -> list[str]:
    """
    Returns a list of rule-violation messages. Empty list means valid.
    Rules:
    - at least 12 characters
    - at least 1 uppercase
    - at least 1 lowercase
    - at least 1 special character
    """
    errors: list[str] = []
    if password is None:
        return ["Password is required."]

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least 1 uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least 1 lowercase letter.")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("Password must contain at least 1 special character.")
    return errors

