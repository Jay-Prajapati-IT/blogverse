import { NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  try {
    // 1. Get currently logged-in user
    const currentUser =
      await getCurrentUser();

    // 2. Must be logged in
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        {
          status: 401,
        }
      );
    }

    // 3. Must actually be admin
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    // 4. Connect to MongoDB
    const client = await clientPromise;

    const db = client.db("blogverse");

    // 5. Get users
    const users = await db
      .collection("users")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    // 6. Return only safe information
    const safeUsers = users.map(
      (user) => ({
        id: user._id.toString(),

        username: user.username,

        fullName: user.fullName,

        email: user.email,

        avatar:
          user.avatar || "male-1",

        role: user.role,
      })
    );

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });

  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users",
      },
      {
        status: 500,
      }
    );
  }
}