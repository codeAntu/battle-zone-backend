import { eq } from "drizzle-orm";
import db from "../../config/db";
import { adminTable, usersTable } from "../../drizzle/schema";

export async function findAdminInDatabase(email: string) {
  const admins = await db
    .select()
    .from(adminTable)
    .where(eq(adminTable.email, email));
  return admins.length > 0 ? admins[0] : null;
}

export async function findAdminById(id: string) {
  const admins = await db
    .select()
    .from(adminTable)
    .where(eq(adminTable.id, Number(id)));
  return admins.length > 0 ? admins[0] : null;
}

export async function checkEmailInUserTable(email: string) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user.length > 0;
}
