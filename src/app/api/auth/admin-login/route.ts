import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // 2. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("blogverse");

    const users = db.collection("users");

    // 3. Find user
    const user = await users.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 }
      );
    }

    // 4. Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 }
      );
    }

    // 5. IMPORTANT: Verify admin role
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have admin access",
        },
        { status: 403 }
      );
    }

    // 6. Create session
    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      role: "admin",
    });

    const response = NextResponse.json({
      success: true,

      message: "Admin login successful",

      user: {
        id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    // 7. Store session cookie
    response.cookies.set(
      "blogverse_session",
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;

  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while logging in",
      },
      { status: 500 }
    );
  }
}