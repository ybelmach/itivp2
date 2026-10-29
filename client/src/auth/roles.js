// Роли по возрастанию прав — как на сервере
const ROLES = ['user', 'moderator', 'admin'];

export const hasRole = (user, required) => Boolean(user) && ROLES.indexOf(user.role) >= ROLES.indexOf(required);
