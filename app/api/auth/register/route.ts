import { authenticate } from '@/lib/auth-service';
export async function POST(request: Request) {
  return authenticate(request, true);
}
