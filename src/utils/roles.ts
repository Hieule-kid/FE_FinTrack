export interface RoleUser {
  roles: string[];
}

export function hasRole(user: RoleUser, role: string): boolean {
  return user.roles.includes(role);
}
