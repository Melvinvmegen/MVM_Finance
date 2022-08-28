const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require("fs");
const { pdfGenerator } = require('./pdfGenerator');
const settings = require('../util/settings')
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = settings.email.sendinblueApiKey;
const AppError = require("../util/AppError");

exports.sendInvoice = async function (invoice, customer) {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  const id = invoice.id
  const invoiceName = 'invoice-' + id + '.pdf'
  invoice.invoiceName = invoiceName
  const writerStream = fs.createWriteStream(invoiceName)
  const doc = pdfGenerator(invoice)
  doc.pipe(writerStream);
  writerStream.on('finish', async () => {
    try {
      sendSmtpEmail = await getMessage(invoice, customer)
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      fs.unlink(invoiceName, (err) => {
        if (err) throw new AppError(err);
        console.log(`${invoiceName} was deleted`);
      });
      return { message: 'Invoice successfully sent !'};
    } catch (error) {
      fs.unlink(invoiceName, (err) => {
        if (err) throw new AppError(err);
        console.log(`${invoiceName} was deleted`);
      });
      throw new AppError(500, "Error sending invoice for invoiceNR: " + error);
    }
  })
}

async function getMessage (invoice, customer) {
  const createdAt = new Date(invoice.createdAt)
  const month = createdAt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const firstname = invoice.firstName
  const doc = fs.readFileSync(invoice.invoiceName, {encoding: 'base64'} );

  return {
    to: [{ "email": customer.email, "name": customer.firstName }],
    sender: { "name": "Melvin van Megen", "email": 'melvin.vmegen@gmail.com'},
    subject: `Facture ${month}`,
    textContent: `Hello ${firstname}, Tu trouveras ci-joint la facture du mois de ${month}.`,
    htmlContent: `<span>Hello ${firstname}</span>
            <br><br>
            <span>Tu trouveras ci-joint la facture du mois de ${month}.</span>
            <br><br>
            <span>Si tu as des questions n'hésite pas à me contacter !</span>
            <br><br>
            <span>Cordialement</span>
            <br><br>
            <span>Melvin van Megen</span>
            <br><br>
            <a href='tel:0764470724'>07 64 47 07 24</a>
            <br><br>
            <a href='https://www.melvinvmegen.com/'>https://www.melvinvmegen.com/</a>
            `,
    attachment: [
      {
        content: doc,
        name: invoice.invoiceName,
      },
    ],
  };
}