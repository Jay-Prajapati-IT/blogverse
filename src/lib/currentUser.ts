import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";
import { verifySessionToken } from "@/lib/auth";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("blogverse_session")?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (!ObjectId.isValid(session.userId)) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db("blogverse");

  const user = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(session.userId),
    });

  if (!user) {
    return null;
  }

  return user;
}