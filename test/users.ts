export const users = {
    accounts: [
      {
        id: "12345",
        user_id: "b9af71b3-731b-4e08-bee8-c455bec0135b",
        name: "Alice",
        email: "alice@email.com",
        password: "pAsSWoRd!",
        roles: ["admin"],
        permissions: ["read:any_account", "read:own_account"]
      },
      {
        id: "67890",
        name: "Bob",
        email: "bob@email.com",
        password: "pAsSWoRd!",
        roles: ["subscriber"],
        permissions: ["read:own_account"]
      }
    ]
  };