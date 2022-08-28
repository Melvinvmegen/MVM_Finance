const { pdfGenerator } = require('../../util/pdfGenerator')
const { setFilters } = require('../../util/filter')
const { notFound, alreadyError } = require('../../util/errorHandler')
const { updateCreateOrDestroyChildItems } = require('../../util/childItemsHandler')
const router = require('express').Router();
const { db }  = require('../../util/database')

router.get('/quotations', async (req, res, next) => {
  const alias = 'q'
  const { per_page, offset, options } = setFilters(req.query, alias)
  // Force allows filtering by bypassing the cache without invalidating it
  const force = (req.query.force === 'true')

  try {
    const quotations_data = await getOrSetCache(`quotations_customer_${req.query.CustomerId}`, async () => {
      const [count] = await db.count('* as count').from("Quotations").where({"CustomerId": req.query.CustomerId})
      const quotations = await db.select(`*`)
      .from({ q: 'Quotations' })
      .offset(offset)
      .limit(per_page)
      .where(options)

      return {rows: quotations, ...count}
    }, force)

    res.status(200).json(quotations_data)
  } catch (error) {
    return next(error)
  }
})

router.get('/quotation/:id', async (req, res, next) => {
  const id = req.params.id
  const isPDF = req.query.pdf

  try {
    const quotation = await getOrSetCache(`quotation_${id}`, async () => {
      const [data] = await db.select('*').from('Quotations').where('id', id)
      if (!data) return notFound(next, 'Quotation')
      const InvoiceItems = await db.select('*').from('InvoiceItems').where('QuotationId', id)
      data.InvoiceItems = InvoiceItems
      return data
    })

    if (!quotation) return notFound(next, 'Quotation')
    if (isPDF) {
      const quotationName = 'quotation-' + id + '.pdf'

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${quotationName}"`)
      let doc = pdfGenerator(quotation)
      doc.pipe(res)
    } else {
      res.status(200).json(quotation)
    }
  } catch (error) {
    return next(error)
  }
})

router.post('/quotation', async (req, res, next) => {
  const { InvoiceItems, ...quotationBody } = req.body

  try {
    const [quotation] = await knex('Quotations').insert(quotationBody).returning('*')
    for (const invoice_item_body of InvoiceItems) {
      const [invoice_item] = await knex('InvoiceItems').insert({...invoice_item_body, QuotationId: quotation.id}).returning('*')
      if (!quotation.InvoiceItems) quotation.InvoiceItems = [];
      quotation.InvoiceItems.push(invoice_item)
    }

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`quotations_customer_${quotation.CustomerId}`)
    res.status(201).json({ message: 'Quotation created successfully', quotation })
  } catch (error) {
    return next(error)
  }
})

router.put('/quotation/:id', async (req, res, next) => {
  const { InvoiceItems, ...quotation_body } = req.body

  try {
    const existing_invoice_items = await db.select('*').from('InvoiceItems').where('QuotationId', req.body.id)

    if (InvoiceItems) await updateCreateOrDestroyChildItems(knex, "InvoiceItems", existing_invoice_items, InvoiceItems)
    const [quotation] = await knex('Quotations').where('id', req.body.id).update(quotation_body).returning('*');

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`quotations_customer_${quotation.CustomerId}`)
    await invalidateCache(`quotation_${quotation.id}`)
    res.status(201).json({ message: 'Quotation updated successfully', quotation })
  } catch (error) {
    return next(error)
  }
})

router.post('/convert_quotation/:id', async (req, res, next) => {

  try {
    const [quotation] = await db.select('*').from('Quotations').where('id', req.params.id);
    if (!quotation) return notFound(next, 'Quotation')
    if (quotation.InvoiceId) return alreadyError(next, 'Quotation already converted.')

    const quotation_values = Object.fromEntries(Object.entries(quotation).filter(([key]) => key !== 'id' && key !== 'InvoiceItems' && key !== 'InvoiceId' && key !== "cautionPaid"))
    
    const [invoice] = await knex('Invoices').insert(quotation_values).returning('*');
    const InvoiceItems = await db.select('*').from('InvoiceItems').where('QuotationId', quotation.id)

    for (const invoice_item_body of InvoiceItems) {
      invoice_item_body.InvoiceId = invoice.id
      const [invoice_item] = await knex('InvoiceItems').where('id', invoice_item_body.id).update(invoice_item_body).returning('*')
      if (!invoice.InvoiceItems) invoice.InvoiceItems = [];
      invoice.InvoiceItems.push(invoice_item)
    }

    quotation.InvoiceId = invoice.id
    await knex('Quotations').where('id', quotation.id).update(quotation)

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache(`quotations_customer_${quotation.CustomerId}`)
    await invalidateCache(`invoices_customer_${invoice.CustomerId}`)
    res.status(200).json({ invoice, message: 'Quotation successfully converted' }) 
  } catch (error) {
    return next(error)
  }
})

router.delete('/quotation/:id', async (req, res, next) => {
  const id = req.params.id

  try {
    const [quotation] = await db.select('*').from('Quotations').where('id', id)
    if (!quotation) return notFound(next, 'Quotation')

    const InvoiceItems = await db.select('*').from('InvoiceItems').where('QuotationId', id)
    if (InvoiceItems) await updateCreateOrDestroyChildItems(knex, "InvoiceItems", InvoiceItems, null)

    await knex('Quotations').where({ id: quotation.id }).del()
    await invalidateCache(`quotations_customer_${quotation.CustomerId}`)
    res.status(200).json({message: 'Quotation successfully destroyed'})
  } catch (error) {
    return next(error)
  }
})

module.exports = router;