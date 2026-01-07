import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { pool } from './db.js'
import { z } from 'zod'

import {
  userIdSchema,
  userInsertSchema,
  userInfoSchema,
} from '../validation/users.schema.js';
import{
  addressIdSchema,
  addressUserIdSchema,
  addressSchema,
  addressUpdateSchema
} from '../validation/addresses.schema.js';

import bcrypt from 'bcryptjs'


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

    const body = await c.req.json();

    const result = userInsertSchema.safeParse(body);

    if (!result.success) {
      const flatError = z.flattenError(result.error);
      return c.json({ success: false, message: flatError }, 400);
    }

    const { name, email, password } = result.data;

    //hashing using bcrypt by salting 10 times
    const hashedPassword = await bcrypt.hash(password, 10);

    const res = await pool.query(
      "Insert into users (name,email,password) values ($1,$2,$3) returning *", [name, email, hashedPassword]
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

    const idParam = c.req.param('id');

    const result = userIdSchema.safeParse({ id: idParam });

    if (!result.success) {
      const flatError = z.flattenError(result.error);
      return c.json({ success: false, message: flatError }, 400);
    }

    const { id: userId } = result.data;

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

    // Validating ID param
    const idParam = c.req.param('id');
    const idResult = userIdSchema.safeParse({ id: idParam });

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) },
        400
      );
    }

    const { id: userId } = idResult.data;

    //Validating req body
    const body = await c.req.json();
    const bodyResult = userInfoSchema.safeParse(body);

    if (!bodyResult.success) {
      return c.json(
        { success: false, message: z.flattenError(bodyResult.error) },
        400
      )
    }

    const { name, email } = bodyResult.data;

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

    // Validating ID param
    const idParam = c.req.param('id');
    const idResult = userIdSchema.safeParse({ id: idParam });

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) },
        400
      );
    }

    const { id: userId } = idResult.data;

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


//API endpoints for Address Module

//add address for a user api
app.post('/users/:userId/addresses', async (c) => {
  try {

    const idParam = c.req.param("userId")
    const idResult = addressUserIdSchema.safeParse({ user_id: idParam })

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) },
        400
      );
    }

    const { user_id } = idResult.data

    const body = await c.req.json()
    const bodyResult = addressSchema.safeParse(body)

    if (!bodyResult.success) {
      return c.json(
        { success: false, message: z.flattenError(bodyResult.error) },
        400
      )
    }

    const { address_line, city, state, postal_code, country } = bodyResult.data

    const res = await pool.query(
      "Insert into addresses (user_id,address_line, city, state, postal_code, country) values ($1,$2,$3,$4,$5,$6) returning *",
      [user_id, address_line, city, state, postal_code, country]
    )

    if (res.rows.length === 0) return c.text('User not found', 404)
    return c.json(res.rows[0])

  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
});

//get all addresses of user
app.get("/users/:userId/addresses", async (c) => {
  try {

    const idParam = c.req.param("userId")
    const idResult = addressUserIdSchema.safeParse({ user_id: idParam })

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) },
        400
      )
    }

    const { user_id } = idResult.data

    const res = await pool.query(
      "Select * from addresses where user_id=$1", [user_id]
    )
    if (res.rows.length === 0) return c.text('User not found', 404)
    return c.json(res.rows)

  } catch (err) {
    console.error(err);
    return c.text('Database error', 500);
  }
})

//update address of a user
app.put("/users/:userId/addresses/:addressId", async (c) => {
  try {
    // fetching the user_id param
    const idParam = c.req.param("userId")
    const idResult = addressUserIdSchema.safeParse({ user_id: idParam })

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) },
        400
      )
    }
    const { user_id } = idResult.data

    //fetching the address id from params
    const addIdParam = c.req.param("addressId")
    const addIdResult = addressIdSchema.safeParse({ id: addIdParam })

    if (!addIdResult.success) {
      return c.json(
        { success: false, message: z.flattenError(addIdResult.error) },
        400
      )
    }
    const { id: address_id } = addIdResult.data

    //fetch the request body

    const body = await c.req.json()
    const result = addressUpdateSchema.safeParse(body)

    if (!result.success) {
      return c.json(
        { success: false, message: z.flattenError(result.error) },
        400
      )
    }

    const data: any = result.data

    if (Object.keys(data).length === 0) {
      return c.json({ success: false, message: "No fields to update" }, 400)
    }

    //updation logic and query
    const fields: string[] = []
    const values: any[] = []
    let index = 1

    for (let key in data) {
      fields.push(`${key} = $${index}`)
      values.push(data[key])
      index += 1
    }

    values.push(user_id)
    values.push(address_id)

    const res = await pool.query(
      `Update addresses SET ${fields.join(", ")} where user_id=$${index} AND id=$${index + 1} returning *`, values
    )

    if (res.rows.length === 0) {
      return c.text("Address not Found, 404")
    }
    return c.json(res.rows[0])

  } catch (err) {
    console.error(err)
    return c.text("Database error", 500)
  }
})

//delete address of a user endpoint

app.delete('/users/:userId/addresses/:addressId', async (c) => {
  try {
    //fetch user id
    const idParam = c.req.param("userId")
    const idResult = addressUserIdSchema.safeParse({ user_id: idParam })

    if (!idResult.success) {
      return c.json(
        { success: false, message: z.flattenError(idResult.error) }, 400
      )
    }

    const { user_id } = idResult.data

    //fetching the address id from params
    const addIdParam = c.req.param("addressId")
    const addIdResult = addressIdSchema.safeParse({ id: addIdParam })

    if (!addIdResult.success) {
      return c.json(
        { success: false, message: z.flattenError(addIdResult.error) },
        400
      )
    }
    const { id: address_id } = addIdResult.data

    //deletion of address

    const res = await pool.query(
      'Delete from addresses where user_id=$1 and id=$2 returning *', [user_id, address_id]
    )

    if (res.rows.length === 0) return c.text('User not found', 404)
    return c.json(res.rows[0])

  } catch (err) {
    console.error(err)
    return c.text("Database error", 500)
  }

})

//get count of addresses per user
app.get('users/addresses/count', async (c) => {
  try {
    const res = await pool.query(
      'Select U.id, U.name, COUNT(A.id) as address_count from users U LEFT JOIN addresses A ON U.id = A.user_id GROUP BY U.name, U.id ORDER BY U.id ASC'
    )

    if (res.rows.length === 0) return c.text('User not found', 404)
    return c.json(res.rows)

  } catch (err) {
    console.error(err)
    return c.text("Database error", 500)
  }
})

//get users who dont have any address
app.get('users/no-addresses/', async (c) => {
  try{
    const res = await pool.query(
      'Select U.id, U.name from users U LEFT JOIN addresses A ON U.id = A.user_id WHERE A.id IS NULL'
    )

    if(res.rows.length===0) return c.text('No Users with no address')
    return c.json(res.rows)

  } catch(err){
    console.error(err)
    return c.text("Database error", 500)
  }
})





serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
