declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string
      /** The user's name. */
      name: string
      /** The user's email. */
      email: string
      /** The user's role. */
      role: string
      /** The user's unit id. */
      unit: string
    }
  }

  interface User {
    /** The user's id. */
    id: string
    /** The user's name. */
    name: string
    /** The user's email. */
    email: string
    /** The user's role. */
    role: string
    /** The user's unit id. */
    unit: string
  }
}
