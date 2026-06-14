# Gmail SMTP Setup for CareerLink

CareerLink uses Gmail SMTP to send 6-digit verification codes for registration and password recovery.

## Steps

1. Turn on 2-Step Verification in your Google account.
2. Create a Gmail App Password:
   - Google Account
   - Security
   - 2-Step Verification
   - App passwords
   - Choose Mail
   - Copy the 16-character password
3. Create this file:

```txt
careerlink-server/.env
```

4. Add these values:

```env
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
OTP_EXPIRY_MINUTES=10
```

5. Restart the backend server after saving `.env`.

Do not commit `.env`. It is already ignored by Git.
