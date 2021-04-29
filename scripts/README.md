# Auth rocket scripts
This is a summary of all the scripts that are added to this repo.

## createUserWithRole

Useful script when adding a booster role with no `signUpMethods`:

```typescript
@Role({
  auth: {
    signUpMethods: [],
  },
})
export class Admin {}
```

**This script will:**
1. Create a user
2. Set a permanent password to the user
3. Assign the `custom:role` attribute

**How to run it**
`./createUserWithRole <userPoolId> <username (email)> <password> <role>`