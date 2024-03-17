import { sendAlert } from "../utils/transporter.js";
import { database } from "../utils/database.js";
import { settings } from "../utils/settings.js";
import { ofetch } from "ofetch";

export async function handleUserStatsTask() {
  console.log("[User Task] ...Querying users to update");
  const users = await database
    .select("user.id")
    .from("user")
    .join("revenu", "revenu.user_id", "user.id")
    .join("investment_profile", "investment_profile.user_id", "user.id")
    .join("tax_profile", "tax_profile.user_id", "user.id")
    .where(
      "revenu.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .orWhere(
      "user.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .orWhere(
      "investment_profile.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .orWhere(
      "tax_profile.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .groupBy("user.id");

  if (users.length) {
    console.log(`[User Task] Found ${users.length} users to update`);
  } else {
    console.log(`[User Task] 0 users to update`);
    return;
  }

  try {
    await ofetch(`${settings.finance.baseRequestsUrl}stats/users`, {
      method: "POST",
      body: { user_ids: users.map((u) => u.id) },
      headers: {
        Authorization: `Basic ${btoa(
          `${settings.finance.apiUsername}:${settings.finance.apiPassword}`
        )}`,
      },
    });
    console.log("[User Task] users stats successfully updated");
  } catch (err) {
    console.log(`[User Task] An error occured`, err);
    sendAlert(
      `[Cron alert] handleUserStatsTask failed`,
      `An error occured for handleUserStatsTask with error ${err}`
    );
  }
}

export async function handleAssetStatsTask() {
  console.log("[Asset Task] ...Querying assets to update");
  const assets = await database
    .select("asset.id")
    .from("asset")
    .leftJoin("cost", "cost.asset_id", "asset.id")
    .leftJoin("credit", "credit.asset_id", "asset.id")
    .leftJoin("crypto_currency", "crypto_currency.asset_id", "asset.id")
    .where(
      "crypto_currency.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .orWhere(
      "cost.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .orWhere(
      "credit.updated_at",
      ">=",
      new Date(new Date() - settings.cron.statsFromMs)
    )
    .groupBy("asset.id");

  if (assets.length) {
    console.log(`[Asset Task] Found ${assets.length} assets to update`);
  } else {
    console.log(`[Asset Task] 0 assets to update`);
    return;
  }

  try {
    await ofetch(`${settings.finance.baseRequestsUrl}stats/assets`, {
      method: "POST",
      body: { assetIds: assets.map((ip) => ip.id) },
      headers: {
        Authorization: `Basic ${btoa(
          `${settings.finance.apiUsername}:${settings.finance.apiPassword}`
        )}`,
      },
    });
    console.log("[Asset Task] assets stats successfully updated");
  } catch (err) {
    console.log(`[Asset Task] An error occured`, err);
    sendAlert(
      `[Cron alert] handleAssetStatsTask failed`,
      `An error occured for handleAssetStatsTask with error ${err}`
    );
  }
}
