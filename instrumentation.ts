export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = await import('dns');
      console.log('Next.js Server initializing. Overriding DNS resolvers to public servers...');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (err) {
      console.warn('Failed to set public DNS servers:', err);
    }
  }
}
