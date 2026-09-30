process.env.NITRO_HOST = '127.0.0.1';
process.env.NITRO_PORT ||= '3000';
await import('../.output/server/index.mjs');
