/** Probe — confirms /api/* rewrite reaches catchall. */
export default function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  res.status(200).json({ user: null, probe: 'catchall-ok' });
}

export const config = {
  runtime: 'nodejs',
};
