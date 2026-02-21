# Production SMTP Configuration Guide

To ensure that your users receive authentication and notification emails 100% of the time, you MUST configure a custom SMTP provider in your Supabase project settings. The default provider is limited and often throttled.

### Recommended Providers
- [SendGrid](https://sendgrid.com/)
- [Postmark](https://postmarkapp.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [Resend](https://resend.com/)

### Configuration Steps

1.  **Get Credentials**: Sign up for one of the providers above and get your SMTP Server, Port, User, and Password.
2.  **Go to Supabase Dashboard**: Navigate to your project.
3.  **Settings**: Click on **Authentication** in the sidebar.
4.  **Email Templates**: Ensure your templates are configured correctly.
5.  **SMTP Settings**:
    - Under **Authentication** > **SMTP Settings**, toggle **Enable Custom SMTP**.
    - Enter your credentials:
        - **Sender Name**: Malika AI (or your business name)
        - **Sender Email**: your-verified@domain.com
        - **Host**: (e.g., smtp.sendgrid.net)
        - **Port**: (usually 587)
        - **User**: (usually `apikey` for SendGrid)
        - **Pass**: (your API Key)
6.  **Test**: Perform a signup in your app to verify the email is sent from your custom domain.

### Important: Redirect URLs
In **Authentication** > **URL Configuration**, ensure your site URL and redirect URLs are correctly set:
- **Site URL**: `https://your-production-app.vercel.app`
- **Redirect URLs**: 
    - `https://your-production-app.vercel.app/**`
    - `http://localhost:5173/**` (for local development)

> [!TIP]
> Using a dedicated domain for your sender email increases the "Trust Score" of your emails and prevents them from landing in Spam.
