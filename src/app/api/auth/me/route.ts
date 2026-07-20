import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import {
  verifySessionToken,
} from "@/lib/auth";

export async function GET() {
  try {

    // 1. Read cookies
    const cookieStore =
      await cookies();

    const token =
      cookieStore
        .get("blogverse_session")
        ?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    // 2. Verify JWT
    const session =
      await verifySessionToken(
        token
      );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    // 3. Find actual user
    const client =
      await clientPromise;

    const db =
      client.db("blogverse");

    const user =
      await db
        .collection("users")
        .findOne({
          _id: new ObjectId(
            session.userId
          ),
        });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 404,
        }
      );
    }

    // 4. Return safe user
    return NextResponse.json({
      success: true,

      user: {
        id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

  } catch (error) {

    console.error(
      "Session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        user: null,
      },
      {
        status: 500,
      }
    );
  }
}