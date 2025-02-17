import { sqliteTable } from "drizzle-orm/sqlite-core";
import { enumColumn, idSystemMetadata, textColumn } from "../helpers";

export type FeatureStatus = "on" | "off" | "testers";
export const features = sqliteTable("features", {
    ...idSystemMetadata("feat_"),
    name: textColumn(),
    status: enumColumn<FeatureStatus>({ defaultValue: "off" }),
});
