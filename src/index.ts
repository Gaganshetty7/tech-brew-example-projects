import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { pool } from '../db.js'

const app = new Hono()

pool.query('SELECT NOW()')
  .then(() => console.log('Connected to Neon!'))
  .catch(err => console.error('Connection failed:', err))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Read endpoint
app.get('/users', async (c) => {
  try {
    const res = await pool.query("Select id, name, email from users");
    return c.json(res.rows)
  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})

//Insert endpoint
app.post('/users', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    const res = await pool.query(
      "Insert into users (name,email,password) values ($1,$2,$3) returning *", [name, email, password]
    );
    return c.json(res.rows[0])
  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})

//Get (user by id) endpoint
app.get('/users/:id', async (c) => {
  try {
    const userId = Number(c.req.param('id'))

    const res = await pool.query(
      "Select id, name, email from users where id = $1", [userId]
    )
    if (!res.rows[0]) return c.text('User not found', 404);
    return c.json(res.rows[0])
  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})

//Update (user by id) endpoint
app.put('/users/:id', async (c) => {
  try {
    const userId = Number(c.req.param('id'))

    const { name, email } = await c.req.json();

    const res = await pool.query(
      "Update users SET name=$1, email=$2 where id = $3 returning *", [name, email, userId]
    )

    if (res.rows.length === 0) return c.text('User not found', 404)

    return c.json(res.rows[0])
  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})

//Delete endpoint
app.delete('/users/:id', async (c) => {
  try {
    const userId = Number(c.req.param('id'))

    const res = await pool.query(
      "Delete from users where id=$1 returning *", [userId]
    )

    if (res.rows.length === 0) return c.text('User not found', 404)

    return c.json(res.rows[0])
  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
