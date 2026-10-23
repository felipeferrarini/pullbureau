export { auth as proxy } from '@/auth'

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|models|fonts|hdri|screenshots|CREDITS\\.md|favicon.ico|entrar|fechado).*)'],
}
