import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Create a MySQL connection pool with the database URL
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
});

// Pass the MySQL connection to drizzle
const db = drizzle(connection);

export default db;