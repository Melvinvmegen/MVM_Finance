ALTER TABLE
  "Users" RENAME COLUMN "lastLogin" TO last_login;

ALTER TABLE
  "Users" RENAME COLUMN "authTicket" TO auth_ticket;

ALTER TABLE
  "Users" RENAME COLUMN "cryptosModuleActive" TO cryptos_module_active;

ALTER TABLE
  "Users" RENAME COLUMN "customersModuleActive" TO customers_module_active;

ALTER TABLE
  "Users" RENAME COLUMN "revenusModuleActive" TO revenus_module_active;

ALTER TABLE "Users"
RENAME TO "user";