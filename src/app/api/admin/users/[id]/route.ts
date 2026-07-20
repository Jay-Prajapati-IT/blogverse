import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/currentUser";

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // 1. Get logged-in user
    const currentUser =
      await getCurrentUser();

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

    // 2. Server-side admin check
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

    // 3. Get target user ID
    const { id } =
      await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        {
          status: 400,
        }
      );
    }

    // 4. Prevent admin deleting themselves
    if (
      currentUser._id.toString() === id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete your own admin account",
        },
        {
          status: 400,
        }
      );
    }

    const client =
      await clientPromise;

    const db =
      client.db("blogverse");

    const users =
      db.collection("users");

    const posts =
      db.collection("posts");

    // 5. Check target exists
    const targetUser =
      await users.findOne({
        _id: new ObjectId(id),
      });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // 6. Delete all posts owned by user
    const deletedPosts =
      await posts.deleteMany({
        authorId: id,
      });

    // 7. Delete user
    await users.deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,

      message:
        "User and their posts deleted successfully",

      deletedPosts:
        deletedPosts.deletedCount,
    });

  } catch (error) {
    console.error(
      "Delete user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
      },
      {
        status: 500,
      }
    );
  }
}