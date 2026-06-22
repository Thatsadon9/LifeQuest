/** Fast health check — no DB, no heavy imports. */
export default function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  res.status(200).json({ ok: true, service: 'lifequest-api', auth: true });
}

export const config = {
  runtime: 'nodejs',
};
