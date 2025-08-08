import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Here you would typically fetch user data from your database
  // For now, we'll just return the userId
  return NextResponse.json({
    message: "This is a protected API route",
    userId: userId,
  });
}

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Handle POST request logic here
  return NextResponse.json({
    message: "POST request successful",
    userId: userId,
  });
}
