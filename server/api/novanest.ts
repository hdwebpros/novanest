// server/api/novanest.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null);

  return await $fetch("https://spitter.happydog.digital/api/novanest", {
    method: event.method,
    body: body,
    headers: {
      // Forward relevant headers
      ...getHeaders(event),
    },
  });
});
