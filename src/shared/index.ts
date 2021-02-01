export const isObject = (val: any): val is Record<any, any> => (
    val !== null && typeof val === 'object'
);

export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue);

export const isArray = Array.isArray;

export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function';

export const isString = (val: unknown): val is string => typeof val === 'string';

export const extend = Object.assign;

export const EMPTY_OBJ: { readonly [key: string]: any } = {};

export const isSameVNodeType = (n1: any, n2: any) => (n1.type === n2.type && n1.key === n2.key);

export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}

const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

export const isModelListener = (key: string) => key.startsWith('onUpdate:')