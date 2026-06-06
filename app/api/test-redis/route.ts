import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await redis.set("hello", "world");

    const value = await redis.get("hello");

    return Response.json({
      success: true,
      value,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
