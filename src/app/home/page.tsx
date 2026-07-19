import { redirect } from 'next/navigation'

// The homepage moved to the root route; keep old /home links working.
export default function HomepageRoute() {
  redirect('/')
}
