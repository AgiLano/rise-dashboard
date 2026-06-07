export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  return Response.json({
    authHeader,
    envSecret: process.env.CRON_SECRET,
    hasSecret: !!process.env.CRON_SECRET,
  });
}
