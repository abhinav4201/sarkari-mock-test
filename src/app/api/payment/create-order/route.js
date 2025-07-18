import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import Razorpay from "razorpay";

const instance = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const userToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    await adminAuth.verifyIdToken(userToken);

    const { amount, currency = "INR" } = await request.json();

    const options = {
      amount: amount * 100, // Amount in the smallest currency unit (e.g., paise for INR)
      currency,
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("RAZORPAY ORDER CREATION ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
