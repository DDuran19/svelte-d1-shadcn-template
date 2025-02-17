import { relations } from "drizzle-orm";
import { features } from "./table";
import { systemMetaDataRelations } from "../helpers";

export const featuresRelations = relations(features, ({ one }) => ({
    ...systemMetaDataRelations(one, features),
}));
