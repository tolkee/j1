import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string, // Store actual email
      username: params.username as string, // Store username separately
    };
  },
  // Disable password validation - allow any password
  validatePasswordRequirements: () => {},
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});
