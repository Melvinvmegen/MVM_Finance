const { pdfGenerator } = require('../../util/pdfGenerator')
const { sendInvoice } = require('../../util/mailer')
const { setFilters } = require('../../util/filter')
const { notFound } = require('../../util/errorHandler')
const { updateCreateOrDestroyChildItems } = require('../../util/childItemsHandler')
const router = require('express').Router();
const { db }  = require('../../util/database')

router.get('/invoices', async (req, res, next) => {
  const alias = 'i'
  const { per_page, offset, options } = setFilters(req.query, alias)
  // Force allows filtering by bypassing the cache without invalidating it
  const force = (req.query.force === 'true')

  try {
    const invoices_data = await getOrSetCache(`invoices_customer_${req.query.CustomerId}`, async () => {
      const [count] = await db.count('* as count').from("Invoices").where({"CustomerId": req.query.CustomerId})
      const invoices = await db.select(`*`)
      .from({ i: 'Invoices' })
      .offset(offset)
      .limit(per_page)
      .where(options)
    
      return {rows: invoices, ...count}
    }, force)
    res.status(200).json(invoices_data)
  } catch (error) {
    return next(error)
  }
})

router.get('/invoice/:id', async (req, res, next) => {
  const id = req.params.id
  const isPDF = req.query.pdf

  try {
    const invoice = await getOrSetCache(`invoice_${id}`, async () => {
      const [invoice] = await db.select('*').from('Invoices').where('id', id)
      if (!invoice) return notFound(next, 'Invoice')
      const InvoiceItems = await db.select('*').from('InvoiceItems').where('InvoiceId', id)
      invoice.InvoiceItems = InvoiceItems
      return invoice
    })

    if (!invoice) return notFound(next, 'Quotation')
    if (isPDF) {
      const invoiceName = 'invoice-' + id + '.pdf'
    
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`)
      let doc = pdfGenerator(invoice)
      doc.pipe(res)
    } else {
      res.status(200).json(invoice)
    }
  } catch (error) {
    return next(error)
  }
})

router.post('/invoice', async (req, res, next) => {
  const { InvoiceItems, ...invoiceBody } = req.body

  try {
    const [invoice] = await knex('Invoices').insert(invoiceBody).returning('*')
    for (const invoice_item_body of InvoiceItems) {
      const [invoice_item] = await knex('InvoiceItems').insert({...invoice_item_body, InvoiceId: invoice.id}).returning('*')
      if (!invoice.InvoiceItems) invoice.InvoiceItems = [];
      invoice.InvoiceItems.push(invoice_item[0])
    }

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`invoices_customer_${invoice.CustomerId}`)
    res.status(201).json({ message: 'Invoice created successfully', invoice})
  } catch (error) {
    return next(error)
  }
})

router.put('/invoice/:id', async (req, res, next) => {
  const { InvoiceItems, ...invoice_body } = req.body

  try {
    const existing_invoice_items = await db.select('*').from('InvoiceItems').where('InvoiceId', req.body.id)

    if (InvoiceItems) await updateCreateOrDestroyChildItems(knex, "InvoiceItems", existing_invoice_items, InvoiceItems)
    const [invoice] = await knex('Invoices').where('id', invoice_body.id).update(invoice_body).returning('*')

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`invoices_customer_${invoice.CustomerId}`)
    await invalidateCache(`invoice_${invoice.id}`)
    res.status(201).json({ message: 'Invoice updated successfully', invoice })
  } catch (error) {
    return next(error)
  }
})

router.get('/send_invoice', async (req, res, next) => {
  try {
    const invoice = req.query
    const InvoiceItems = await db.select('*').from('InvoiceItems').where('InvoiceId', invoice.id)
    invoice.InvoiceItems = InvoiceItems
    const [customer] = await db.select('*').from('Invoices').where('CustomerId', invoice.CustomerId)

    const message = await sendInvoice(invoice, customer)
    res.status(200).json({ message })
  } catch (error) {
    return next(error)
  }
})

router.delete('/invoice/:id', async (req, res, next) => {
  const id = req.params.id
  
  try {
    const [invoice] = await db.select('*').from('Invoices').where('id', id)
    if (!invoice) return notFound(next, 'Invoice')

    const InvoiceItems = await db.select('*').from('InvoiceItems').where('InvoiceId', id)
    if (InvoiceItems) await updateCreateOrDestroyChildItems(knex, "InvoiceItems", InvoiceItems, null)

    await knex('Invoices').where({ id: id }).del()

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`invoices_customer_${invoice.CustomerId}`)
    res.status(200).json({message: 'Invoice successfully destroyed'})
  } catch (error) {
    return next(error)
  }
})

module.exports = router;