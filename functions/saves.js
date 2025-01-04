export function onRequestGet(ctx) {
  const db = ctx.env.DATABASE;
  const res = await DATABASE.prepare("SELECT name, COUNT(data) as count FROM evolve GROUP BY name")
    .all();
  return Response.json(res.results);
}

