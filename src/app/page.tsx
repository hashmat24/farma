
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Direct landing to chat or login handled by AuthGuard, 
  // but we can enforce a default path here.
  redirect('/chat');
}
