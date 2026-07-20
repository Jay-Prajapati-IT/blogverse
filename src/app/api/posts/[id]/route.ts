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
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid post ID",
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

    const posts =
      db.collection("posts");

    const post =
      await posts.findOne({
        _id: new ObjectId(id),
      });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Post not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
      User can delete own post.

      Admin can delete ANY post.
    */
    const ownsPost =
      post.authorId ===
      user._id.toString();

    const isAdmin =
      user.role === "admin";

    if (!ownsPost && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete this post",
        },
        {
          status: 403,
        }
      );
    }

    await posts.deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message:
        "Post deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete post error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete post",
      },
      {
        status: 500,
      }
    );
  }
}