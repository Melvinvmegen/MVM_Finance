/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "../../plugins/ofetch";

/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/banks.js").getBanks>>}
**/
export async function getBanks(query = undefined) {
  return await useOFetch(`/api/user/banks`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} bankId
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/banks.js").getBank>>}
**/
export async function getBank(bankId, query = undefined) {
  return await useOFetch(`/api/user/banks/${bankId}`, { method: "GET", query });
}
/**
 * @param {Parameters<import("../../../../backend/api/user/banks.js").createBank>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/banks.js").createBank>>}
**/
export async function createBank(body = undefined, query = undefined) {
  return await useOFetch(`/api/user/banks`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} bankId
 * @param {Parameters<import("../../../../backend/api/user/banks.js").updateBank>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/banks.js").updateBank>>}
**/
export async function updateBank(bankId, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/banks/${bankId}`, { method: "PUT", body, query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cash-pots.js").getCashPots>>}
**/
export async function getCashPots(query = undefined) {
  return await useOFetch(`/api/user/cash-pots`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} cashPotId
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cash-pots.js").getCashPot>>}
**/
export async function getCashPot(cashPotId, query = undefined) {
  return await useOFetch(`/api/user/cash-pots/${cashPotId}`, { method: "GET", query });
}
/**
 * @param {Parameters<import("../../../../backend/api/user/cash-pots.js").createCashPot>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cash-pots.js").createCashPot>>}
**/
export async function createCashPot(body = undefined, query = undefined) {
  return await useOFetch(`/api/user/cash-pots`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} cashPotId
 * @param {Parameters<import("../../../../backend/api/user/cash-pots.js").updateCashPot>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cash-pots.js").updateCashPot>>}
**/
export async function updateCashPot(cashPotId, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/cash-pots/${cashPotId}`, { method: "PUT", body, query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cryptos.js").getCryptos>>}
**/
export async function getCryptos(query = undefined) {
  return await useOFetch(`/api/user/cryptos`, { method: "GET", query });
}
/**
 * @param {Parameters<import("../../../../backend/api/user/cryptos.js").createCrypto>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cryptos.js").createCrypto>>}
**/
export async function createCrypto(body = undefined, query = undefined) {
  return await useOFetch(`/api/user/cryptos`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/cryptos.js").updateCrypto>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cryptos.js").updateCrypto>>}
**/
export async function updateCrypto(id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/cryptos/${id}`, { method: "PUT", body, query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/cryptos.js").refreshCryptos>>}
**/
export async function refreshCryptos(query = undefined) {
  return await useOFetch(`/api/user/cryptos/refresh-cryptos`, { method: "GET", query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/customers.js").getCustomers>>}
**/
export async function getCustomers(query = undefined) {
  return await useOFetch(`/api/user/customers`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/customers.js").getCustomer>>}
**/
export async function getCustomer(id, query = undefined) {
  return await useOFetch(`/api/user/customers/${id}`, { method: "GET", query });
}
/**
 * @param {Parameters<import("../../../../backend/api/user/customers.js").createCustomer>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/customers.js").createCustomer>>}
**/
export async function createCustomer(body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/customers.js").updateCustomer>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/customers.js").updateCustomer>>}
**/
export async function updateCustomer(id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${id}`, { method: "PUT", body, query });
}
/**
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/customers.js").deleteCustomer>>}
**/
export async function deleteCustomer(id, query = undefined) {
  return await useOFetch(`/api/user/customers/${id}`, { method: "DELETE", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").getInvoices>>}
**/
export async function getInvoices(CustomerId, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").getInvoice>>}
**/
export async function getInvoice(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices/${id}`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {void}
**/
export async function downloadInvoice(CustomerId, id, query = undefined) {
  const response = await useOFetchRaw(`/api/user/customers/${CustomerId}/invoices/${id}/download`, { responseType: "blob", query });
  const href = URL.createObjectURL(response._data);
  const a = document.createElement("a");
  a.href = href;
  a.download = ((response.headers.get("content-disposition") || "").match(/filename="?(.+)"?/) || [])[1] || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
  return null;
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {Parameters<import("../../../../backend/api/user/invoices.js").createInvoice>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").createInvoice>>}
**/
export async function createInvoice(CustomerId, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/invoices.js").updateInvoice>[2]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").updateInvoice>>}
**/
export async function updateInvoice(CustomerId, id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices/${id}`, { method: "PUT", body, query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").sendInvoice>>}
**/
export async function sendInvoice(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices/${id}/send-invoice`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/invoices.js").deleteInvoice>>}
**/
export async function deleteInvoice(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/invoices/${id}`, { method: "DELETE", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").getQuotations>>}
**/
export async function getQuotations(CustomerId, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").getQuotation>>}
**/
export async function getQuotation(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations/${id}`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {void}
**/
export async function downloadQuotation(CustomerId, id, query = undefined) {
  const response = await useOFetchRaw(`/api/user/customers/${CustomerId}/quotations/${id}/download`, { responseType: "blob", query });
  const href = URL.createObjectURL(response._data);
  const a = document.createElement("a");
  a.href = href;
  a.download = ((response.headers.get("content-disposition") || "").match(/filename="?(.+)"?/) || [])[1] || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
  return null;
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {Parameters<import("../../../../backend/api/user/quotations.js").createQuotation>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").createQuotation>>}
**/
export async function createQuotation(CustomerId, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/quotations.js").updateQuotation>[2]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").updateQuotation>>}
**/
export async function updateQuotation(CustomerId, id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations/${id}`, { method: "PUT", body, query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/quotations.js").convertQuotationToInvoice>[2]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").convertQuotationToInvoice>>}
**/
export async function convertQuotationToInvoice(CustomerId, id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations/convert-quotation/${id}`, { method: "POST", body, query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").sendQuotation>>}
**/
export async function sendQuotation(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations/${id}/send-quotation`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} CustomerId
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/quotations.js").deleteQuotation>>}
**/
export async function deleteQuotation(CustomerId, id, query = undefined) {
  return await useOFetch(`/api/user/customers/${CustomerId}/quotations/${id}`, { method: "DELETE", query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").getRevenus>>}
**/
export async function getRevenus(query = undefined) {
  return await useOFetch(`/api/user/revenus`, { method: "GET", query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").getRevenuIds>>}
**/
export async function getRevenuIds(query = undefined) {
  return await useOFetch(`/api/user/revenus/ids`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} id
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").getRevenu>>}
**/
export async function getRevenu(id, query = undefined) {
  return await useOFetch(`/api/user/revenus/${id}`, { method: "GET", query });
}
/**
 * @param {string|string[]|number} bankId
 * @param {Record<string, any>} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").createRevenu>>}
**/
export async function createRevenu(bankId, body = undefined, query = undefined) {
  const formData = new FormData();
  for (const key in body) {
    if (body[key] instanceof Array && body[key][0] instanceof Blob) {
      // append last
    } else if (body[key] instanceof Blob) {
      // append last
    } else if (typeof body[key] === "string") {
      formData.append(key, body[key]);
    } else {
      formData.append(key, new Blob([JSON.stringify(body[key])], { type: "application/json" }));
    }
  }
  for (const key in body) {
    if (body[key] instanceof Array && body[key][0] instanceof Blob) {
      for (const blob of body[key]) formData.append(key, blob);
    } else if (body[key] instanceof Blob) {
      formData.append(key, body[key]);
    }
  }
  return await useOFetch(`/api/user/revenus/${bankId}`, { method: "POST", query, body: formData });
}
/**
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/revenus.js").updateRevenu>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").updateRevenu>>}
**/
export async function updateRevenu(id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/revenus/${id}`, { method: "PUT", body, query });
}
/**
 * @param {string|string[]|number} id
 * @param {string|string[]|number} CostId
 * @param {Parameters<import("../../../../backend/api/user/revenus.js").updateRevenuCost>[2]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").updateRevenuCost>>}
**/
export async function updateRevenuCost(id, CostId, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/revenus/${id}/costs/${CostId}`, { method: "PUT", body, query });
}
/**
 * @param {string|string[]|number} id
 * @param {Parameters<import("../../../../backend/api/user/revenus.js").createRevenuWithdrawal>[1]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/user/revenus.js").createRevenuWithdrawal>>}
**/
export async function createRevenuWithdrawal(id, body = undefined, query = undefined) {
  return await useOFetch(`/api/user/revenus/${id}/withdrawals`, { method: "POST", body, query });
}
