import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { username, fullName, email, password } = body;

    // 1. Validate fields
    if (!username || !fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    // 2. Basic password validation
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("blogverse");

    const users = db.collection("users");

    // 3. Normalize values
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // 4. Check if email or username already exists
    const existingUser = await users.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or username already exists",
        },
        { status: 409 }
      );
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Create user
    const newUser = {
      username: normalizedUsername,
      fullName: fullName.trim(),
      email: normalizedEmail,

      // Never store original password
      passwordHash,

      // Public registration is ALWAYS user
      role: "user",

      avatar: "male-1",

      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // 7. Return safe data only
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: result.insertedId.toString(),
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating account",
      },
      { status: 500 }
    );
  }
}