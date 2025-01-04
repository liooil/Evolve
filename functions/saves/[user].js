export async function onRequestGet(ctx) {
  const user = ctx.params.user;
  const db = ctx.env.DATABASE;
  const res = await DATABASE.prepare("SELECT * FROM evolve WHERE name = ?")
    .bind(name)
    .all();
  return Response.json(res.results);
}

export async function onRequestPost(ctx) {
  const user = ctx.params.user;
  const db = ctx.env.DATABASE;
  const { data, autoIds } = await ctx.request.json();
  const res = await DATABASE.prepare("INSERT INTO evolve (name, data, autoIds, created_at) VALUES (?, ?, ?, ?)")
    .bind(name, data, autoIds, new Date().toISOString())
    .run();
  return Response.json(res.results);
}

