export const isObject = (val: any): val is Record<any, any> => (
    val !== null && typeof val === 'object'
);
  