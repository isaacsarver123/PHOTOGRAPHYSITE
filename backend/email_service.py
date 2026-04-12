import asyncio
import logging
import config

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_content: str):
    if config.SMTP_HOST and config.SMTP_USER and config.SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart('alternative')
            msg['From'] = config.SENDER_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))
            def _send():
                with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
                    server.starttls()
                    server.login(config.SMTP_USER, config.SMTP_PASSWORD)
                    server.send_message(msg)
            await asyncio.to_thread(_send)
            logger.info(f"Email sent via SMTP to {to_email}: {subject}")
            return {"id": "smtp_sent", "status": "sent"}
        except Exception as e:
            logger.error(f"SMTP email failed: {e}")
            return None

    if config.RESEND_API_KEY and config.RESEND_API_KEY != 're_mock_key':
        try:
            import resend
            resend.api_key = config.RESEND_API_KEY
            params = {"from": config.SENDER_EMAIL, "to": [to_email], "subject": subject, "html": html_content}
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent via Resend to {to_email}: {email}")
            return {"id": str(email), "status": "sent"}
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Resend email failed: {error_msg}")
            if "not verified" in error_msg.lower():
                return {"id": "domain_not_verified", "status": "error", "error": "Domain not verified in Resend. Go to resend.com/domains to verify skylinemedia.net"}
            return None

    logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}")
    logger.info(f"[MOCK EMAIL] Content: {html_content[:200]}...")
    return {"id": "mock_email_id", "status": "mocked"}


async def send_booking_request_email(booking: dict):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Booking Request Received!</h1>
            <p>Hi {booking['name']},</p>
            <p>Thank you for your booking request with SkyLine Media. We've received your request and will review it shortly.</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong>Requested Date:</strong> {booking['scheduled_date']}</p>
                <p><strong>Time:</strong> {booking['scheduled_time']}</p>
                <p><strong>Package:</strong> {booking['package_id'].title()}</p>
                <p><strong>Property:</strong> {booking['property_address']}</p>
                <p><strong>Location:</strong> {booking.get('service_area', 'Calgary/Edmonton')}</p>
            </div>
            <p><strong>What's Next?</strong></p>
            <p>Our team will review your request and confirm availability. Once approved, you'll receive an email with:</p>
            <ul><li>Confirmed date and time</li><li>Final pricing details</li><li>Secure payment link</li></ul>
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Booking Request Received - SkyLine Media", html)


async def send_booking_approved_email(booking: dict, payment_url: str):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Booking Approved!</h1>
            <p>Hi {booking['name']},</p>
            <p>Great news! Your booking request has been approved.</p>
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong>Confirmed Date:</strong> {booking['scheduled_date']}</p>
                <p><strong>Time:</strong> {booking['scheduled_time']}</p>
                <p><strong>Package:</strong> {booking['package_id'].title()}</p>
                <p><strong>Property:</strong> {booking['property_address']}</p>
                <p><strong>Total:</strong> ${booking['total_amount']:.2f} CAD</p>
            </div>
            <p><strong>Complete Your Payment:</strong></p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{payment_url}" style="background: #d4af37; color: black; padding: 15px 30px; text-decoration: none; font-weight: bold; display: inline-block;">Pay ${booking['total_amount']:.2f} CAD</a>
            </div>
            <p style="color: #666; font-size: 12px;">This payment link will expire in 24 hours.</p>
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Booking Approved - Complete Your Payment", html)


async def send_photos_ready_email(booking: dict):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Your Photos Are Ready!</h1>
            <p>Hi {booking['name']},</p>
            <p>Great news! Your drone photography session is complete and your photos are ready for download.</p>
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404;"><strong>Important:</strong> Your photos will be automatically deleted 30 days after your first download. Please make sure to download and save all your photos before then.</p>
            </div>
            <p>Log in to your dashboard to view and download your images.</p>
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Your Photos Are Ready - SkyLine Media", html)
