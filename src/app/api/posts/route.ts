import { NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
    try {
        const client =
            await clientPromise;

        const db =
            client.db("blogverse");

        const posts =
            await db
                .collection("posts")
                .find({})
                .sort({
                    createdAt: -1,
                })
                .toArray();

        const formattedPosts =
            posts.map((post) => ({
                id: post._id.toString(),

                title: post.title,

                category: post.category,

                image: post.image,

                desc: post.desc,

                content: post.content,

                authorId: post.authorId,

                author: post.author,

                date:
                    post.createdAt
                        ?.toISOString()
                        .split("T")[0] ?? "",

                readTime:
                    `${Math.max(
                        3,
                        Math.ceil(
                            post.content.length / 500
                        )
                    )} min read`,

                approved: true,
            }));

        return NextResponse.json({
            success: true,
            posts: formattedPosts,
        });

    } catch (error) {
        console.error(
            "Load posts error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to load posts",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(request: Request) {
    try {
        // 1. Check authentication
        const user = await getCurrentUser();

        if (!user) {
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

        // 2. Read form data
        const body = await request.json();

        const {
            title,
            category,
            image,
            desc,
            content,
        } = body;

        // 3. Validate
        if (
            !title ||
            !category ||
            !desc ||
            !content
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "All required fields must be filled",
                },
                {
                    status: 400,
                }
            );
        }

        // 4. Connect MongoDB
        const client = await clientPromise;
        const db = client.db("blogverse");

        // 5. Create post
        const newPost = {
            title: title.trim(),
            category,
            image: image || "ai",
            desc: desc.trim(),
            content: content.trim(),

            authorId: user._id.toString(),
            author: user.fullName,

            createdAt: new Date(),

            approved: true,
        };

        const result = await db
            .collection("posts")
            .insertOne(newPost);

        return NextResponse.json(
            {
                success: true,

                message: "Post created successfully",

                post: {
                    id: result.insertedId.toString(),
                    ...newPost,
                },
            },
            {
                status: 201,
            }
        );

    } catch (error) {
        console.error(
            "Create post error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create post",
            },
            {
                status: 500,
            }
        );
    }
}