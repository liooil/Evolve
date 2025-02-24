export async function onRequestGet(ctx) {
  const user = ctx.params.user;
  const limit = ctx.request.header.get("limit") ?? "16";
  const offset = ctx.request.header.get("offset") ?? "0";
  const db = ctx.env.DATABASE;
  const res = await db.prepare("SELECT * FROM evolve WHERE name = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(user, limit, offset)
    .all();
  return Response.json(res.results);
}

export async function onRequestPost(ctx) {
  const user = ctx.params.user;
  const db = ctx.env.DATABASE;
  const { data, autoIds } = await ctx.request.json();
  const res = await db.prepare("INSERT INTO evolve (name, data, autoIds, created_at) VALUES (?, ?, ?, ?)")
    .bind(user, data, autoIds, new Date().toISOString())
    .run();
  return Response.json(res.results);
}
