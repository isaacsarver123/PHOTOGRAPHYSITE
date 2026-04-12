from fastapi import APIRouter, Request, HTTPException
import logging

import config
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    stripe_checkout = StripeCheckout(api_key=config.STRIPE_API_KEY)
    status = await stripe_checkout.get_checkout_status(session_id)
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": status.status, "payment_status": status.payment_status}}
    )
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("booking_id"):
            await db.bookings.update_one(
                {"id": transaction["booking_id"]},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": "cad"}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    stripe_checkout = StripeCheckout(api_key=config.STRIPE_API_KEY)
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {"status": webhook_response.payment_status, "payment_status": webhook_response.payment_status}}
        )
        if webhook_response.payment_status == "paid":
            booking_id = webhook_response.metadata.get("booking_id")
            if booking_id:
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}
