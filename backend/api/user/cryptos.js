const axios = require('axios').default;
const router = require('express').Router();
const { getOrSetCache } = require('../../util/cacheManager')
const { updateCreateOrDestroyChildItems } = require('../../util/childItemsHandler')
const { db }  = require('../../util/database')

router.get('/cryptos', async (req, res, next) => {
  try {
    const cryptos_data = await getOrSetCache(`cryptos`, async () => {
      const cryptos = await db.select('*').from('Cryptos').orderBy('sold', 'asc')
      for (const crypto of cryptos) {
        const transactions = await db.select('*').from('Transactions').where('CryptoId', crypto.id).orderBy('createdAt', 'desc');
        crypto.Transactions = transactions
      }
      
      return cryptos
    })

    res.status(200).json(cryptos_data)
  } catch (error) {
    return next(error)
  }
})

router.post('/crypto', async (req, res, next) => {
  const { Transactions, ...cryptoBody } = req.body
  let requestOptions = {
    method: 'GET',
    url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    params: {
      'start': '1',
      'limit': '5000',
      'convert': 'EUR'
    },
    headers: {
      'X-CMC_PRO_API_KEY': '9a874839-5e36-4cec-bcbe-ac2f7927c74f'
    },
    json: true,
    gzip: true
  };
  try {
    const response = await axios(requestOptions)
    const fetchedCrypto = response.data.data.filter((element) => element.name === req.body.name)
    const values = fetchedCrypto[0].quote.EUR
    const totalTransactions = req.body.Transactions.map(transaction => transaction.price * transaction.quantity).reduce((sum, item) => sum + item, 0)
    const totalQuantityTransactions = req.body.Transactions.map(transaction => transaction.quantity).reduce((sum, item) => sum + item, 0)

    const [crypto] = await db('Cryptos').insert({
      ...cryptoBody,
      pricePurchase: totalTransactions / totalQuantityTransactions,
      price: req.body.price || values.price,
      priceChange: values.percent_change_30d || 0,
    }).returning('*')

    for (const transaction_body of Transactions) {
      const initialDate = new Date(transaction_body.buyingDate);
      const firstDay = new Date(initialDate.getFullYear(), initialDate.getMonth())
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
      const [revenu] = await db.select('*')
        .from('Revenus')
        .where('createdAt', '>', firstDay)
        .where('createdAt', '<', lastDay)
      
      const [transaction] = await db('Transactions').insert({...transaction_body, CryptoId: crypto.id, RevenuId: revenu?.id }).returning('*')
      if (!crypto.Transactions) crypto.Transactions = [];

      crypto.Transactions.push(transaction)
    }

    await invalidateCache(`cryptos`)
    res.status(201).json({ message: 'Crypto created successfully', crypto })
  } catch (error) {
    return next(error)
  }
});

router.put('/crypto/:id', async (req, res, next) => {
  const { Transactions, ...crypto_body } = req.body
  let requestOptions = {
    method: 'GET',
    url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    params: {
      'start': '1',
      'limit': '5000',
      'convert': 'EUR'
    },
    headers: {
      'X-CMC_PRO_API_KEY': '9a874839-5e36-4cec-bcbe-ac2f7927c74f'
    },
    json: true,
    gzip: true
  };

  try {
    const response = await axios(requestOptions)
    const fetchedCrypto = response.data.data.filter((element) => element.name === req.body.name)
    const values = fetchedCrypto[0].quote.EUR
    const totalTransactions = Transactions.map(transaction => transaction.price * transaction.quantity).reduce((sum, item) => sum + item, 0)
    const totalQuantityTransactions = Transactions.map(transaction => transaction.quantity).reduce((sum, item) => sum + item, 0)
    
    const existing_transactions = await db.select('*').from('Transactions').where('CryptoId', req.params.id);
    if (Transactions) await updateCreateOrDestroyChildItems(db, "Transactions", existing_transactions, Transactions);
    
    const [crypto] = await db('Cryptos')
      .where('id', req.params.id)
      .update({...crypto_body, pricePurchase: totalTransactions / (totalQuantityTransactions || 1), price: req.body.price || values.price, priceChange: values.percent_change_30d || 0})
      .returning('*');

    const transactions = await db.select('*').from('Transactions').where('CryptoId', req.params.id)
    for (const transaction_body of transactions) {
      const initialDate = new Date(transaction_body.buyingDate);
      const firstDay = new Date(initialDate.getFullYear(), initialDate.getMonth())
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
      const [revenu] = await db.select('*')
        .from('Revenus')
        .where('createdAt', '>', firstDay)
        .where('createdAt', '<', lastDay)
      
      const [transaction] = await db('Transactions').where('id', transaction_body.id).update({...transaction_body, CryptoId: crypto.id, RevenuId: revenu?.id }).returning('*')
      if (!crypto.Transactions) crypto.Transactions = [];

      crypto.Transactions.push(transaction)
    }

    await invalidateCache(`cryptos`)
    res.status(201).json({ message: 'Crypto successfully updated', crypto })
  } catch (error) {
    return next(error)
  }
});

router.get('/update_cryptos', async (req, res, next) => {
  let requestOptions = {
    method: 'GET',
    url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    params: {
      'start': '1',
      'limit': '5000',
      'convert': 'EUR'
    },
    headers: {
      'X-CMC_PRO_API_KEY': '9a874839-5e36-4cec-bcbe-ac2f7927c74f'
    },
    json: true,
    gzip: true
  };
  try {
    const response = await axios(requestOptions)
    const cryptos = await db.select('*').from('Cryptos')
    let updated_cryptos = []

    for (crypto of cryptos) {
      const foundCrypto = response.data.data.filter((element) => element.name === crypto.name)[0]
      const [ updated_crypto ] = await db('Cryptos')
        .where('id', crypto.id)
        .update({price: foundCrypto.quote.EUR.price, priceChange: crypto.price - crypto.pricePurchase})
        .returning('*')
      updated_cryptos.push(updated_crypto)
    } 

    await invalidateCache(`cryptos`)
    res.status(201).json({ message: 'Crypto successfully fetched', updated_cryptos })
  } catch (error) {
    return next(error)
  }
});

module.exports = router;