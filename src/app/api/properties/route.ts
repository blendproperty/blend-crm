import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const properties = await db.property.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { reference: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    select: { id: true, reference: true, title: true, address: true },
    orderBy: { title: "asc" },
    take: 8,
  });

  return Response.json({ properties });
}
