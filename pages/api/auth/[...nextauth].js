import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.LinkedIn({
      clientId: `77rw6mifgrzixo`,
      clientSecret: `R8Zw1M4wY8FXItn5`
    })
  ]

})