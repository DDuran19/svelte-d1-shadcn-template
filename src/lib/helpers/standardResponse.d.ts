declare type StdResponse<T extends any = any, E extends any = T> =
    | {
          success: true;
          message: string;
          data: T;
      }
    | {
          success: false;
          message: string;
          data: E;
          error?: Error;
      };
