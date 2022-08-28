const { setFilters } = require('../../util/filter')
const { notFound } = require('../../util/errorHandler')
const { getOrSetCache } = require('../../util/cacheManager')
const { db }  = require('../../util/database')
const router = require('express').Router();

router.get('/customers', async (req, res, next) => {
  const alias = 'c'
  const { per_page, offset, options } = setFilters(req.query, alias)
  // Force allows filtering by bypassing the cache without invalidating it
  const force = (req.query.force === 'true')
  try {
    const result = await getOrSetCache('customers', async () => {
      const [count] = await db.count('* as count').from("Customers")
      const customers = await db.select(`${alias}.id`, `${alias}.firstName`, `${alias}.lastName`, `${alias}.email`, `${alias}.phone`, `${alias}.company`, `${alias}.address`, `${alias}.city`, `${alias}.siret`)
      .sum('Invoices.total as invoices_total')
      .sum('Invoices.tvaAmount as tva_amount_collected')
      .from({ c: 'Customers' })
      .leftJoin('Invoices', 'Invoices.CustomerId', `${alias}.id`)
      .groupBy(`${alias}.id`)
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(per_page)
      .where(options)

      return {rows: customers, ...count}
    }, force)

    res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/customer/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const customer = await getOrSetCache(`customer_${id}`, async () => {
      const [customer] = await db.select('*').from('Customers').where('id', id)
      if (!customer) return notFound(next, 'Customer')
      return customer
    })

    res.status(200).json(customer)
  } catch (error) {
    return next(error)
  }
})

router.post('/customer', async (req, res, next) => {
  try {
    const [customer] = await knex('Customers').insert(req.body).returning('*')
    
    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache('customers')
    res.status(201).json({ message: 'Customer created successfully', customer })
  } catch (error) {
    return next(error)
  }
})

router.put('/customer/:id', async (req, res, next) => {
  try {
    const [customer] = await knex('Customers')
      .where('id', req.body.id)
      .update(req.body)
      .returning('*')

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`customer_${customer.id}`)
    res.status(201).json({ message: 'Customer updated successfully', customer: customer })
  } catch (error) {
    return next(error)
  }
})

router.delete('/customer/:id', async (req, res, next) => {
  try {

    await knex('Customers').where('id', req.params.id).del()

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache('customers')
    res.status(200).json({message: 'Customer successfully destroyed'})
  } catch (error) {
    return next(error)
  }
})

module.exports = router;