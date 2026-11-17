import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    try {
      const user = await adminAuth.getUserByEmail(email.trim());

      const providers = user.providerData.map(
        (provider) => provider.providerId
      );

      return NextResponse.json({
        exists: true,
        providers,
      });
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        return NextResponse.json({
          exists: false,
          providers: [],
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Check account error:", error);

    return NextResponse.json(
      { error: "Unable to check the account." },
      { status: 500 }
    );
  }
}
