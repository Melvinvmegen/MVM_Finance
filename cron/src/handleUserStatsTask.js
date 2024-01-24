import { database } from "../utils/database.js";
import { settings } from "../utils/settings.js";
import { ofetch } from "ofetch";

const nbMinutes = 2;
export async function handleUserStatsTask() {
  console.log("[User Task] ...Querying investment_profiles to update");
  const investment_profiles = await database
    .select("investment_profile.id")
    .from("Users")
    .join("Revenus", "Revenus.UserId", "Users.id")
    .join("investment_profile", "investment_profile.user_id", "Users.id")
    .where("Revenus.updatedAt", ">=", new Date(new Date() - nbMinutes * 60000))
    .orWhere("Users.updatedAt", ">=", new Date(new Date() - nbMinutes * 60000))
    .groupBy("investment_profile.id");

  if (investment_profiles.length) {
    console.log(
      `[User Task] Found ${investment_profiles.length} investment_profiles to update`
    );
  } else {
    console.log(`[User Task] 0 investment_profiles to update`);
    return;
  }

  try {
    await ofetch(
      `${settings.finance.baseRequestsUrl}stats/investment-profiles`,
      {
        method: "POST",
        body: { investmentProfileIds: investment_profiles.map((ip) => ip.id) },
        headers: {
          Authorization: `Basic ${btoa(
            `${settings.finance.apiUsername}:${settings.finance.apiPassword}`
          )}`,
        },
      }
    );
    console.log("[User Task] investment_profiles stats successfully updated");
  } catch (err) {
    console.log(`[User Task] An error occured`, err);
    // TODO: send email to myself
  }
}

export async function handleAssetStatsTask() {
  console.log("[Asset Task] ...Querying assets to update");
  const assets = await database
    .select("asset.id")
    .from("asset")
    .leftJoin("Costs", "Costs.asset_id", "asset.id")
    .leftJoin("Credits", "Credits.asset_id", "asset.id")
    .leftJoin("CryptoCurrencies", "CryptoCurrencies.asset_id", "asset.id")
    .where(
      "CryptoCurrencies.updatedAt",
      ">=",
      new Date(new Date() - nbMinutes * 60000)
    )
    .orWhere("Costs.updatedAt", ">=", new Date(new Date() - nbMinutes * 60000))
    .orWhere(
      "Credits.updatedAt",
      ">=",
      new Date(new Date() - nbMinutes * 60000)
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
    // TODO: send email to myself
  }
}
