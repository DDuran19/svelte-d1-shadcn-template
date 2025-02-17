import { browser } from "$app/environment";
import { app } from "$lib/client/app";
import { convertTimestampsToDates } from "$lib/common";
import { setContext, getContext } from "svelte";

const key = Symbol("features");
export type Feature = Types.clientSide<Types.feature>;
class FeaturesContext {
    features: Feature[] = [];

    constructor(features: Types.feature[] | Feature[]) {
        this.features = features.map((feature) =>
            convertTimestampsToDates(feature)
        );

        if (browser && !this.features.length) {
            app.api.features
                .$get()
                .then(async (res) => await res.json())
                .then(
                    (res) =>
                    (this.features = res.data.map((feature) =>
                        convertTimestampsToDates(feature)
                    ))
                );
        }
    }
    isAllowed<T extends string[]>(
        features: [...T],
        user?: Types.user
    ): { [K in keyof T]: boolean } {
        let tester = user && user.tester;

        return features.map((feature) => {
            const found = this.features.find((f) => f.name === feature);

            if (tester || found?.status === "testers") return true;

            return found?.status === "on";
        }) as { [K in keyof T]: boolean };
    }
}

export function setFeaturesContext(features: Types.feature[] | Feature[]) {
    return setContext(key, new FeaturesContext(features));
}

export function getFeaturesContext() {
    return getContext<ReturnType<typeof setFeaturesContext>>(key);
}
