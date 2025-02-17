import { errorOnDbConnection } from "../helpers";

export async function getFeatures(
    db: Types.db
): Promise<App.DefaultResponse<Types.feature[]>> {
    let error = false;

    const features = await db.query.features
        .findMany()
        .catch((err: any) => {
            error = true;
            console.log({ err });
            return [];
        });

    if (error) return errorOnDbConnection<Types.feature[]>([]);

    return {
        success: true,
        message: "Features fetched successfully",
        data: features,
        page_info: { total: features.length, page: 1, size: features.length },
    };
}
