/**
 * ts 相关定义
 */
export const enum ReactiveFlags {
    SKIP = '__v_skip',
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    RAW = '__v_raw'
}

export interface Target {
    [ReactiveFlags.SKIP]?: boolean
    [ReactiveFlags.IS_REACTIVE]?: boolean
    [ReactiveFlags.IS_READONLY]?: boolean
    [ReactiveFlags.RAW]?: any
}

export type KeyToDepMap = Map<any, Dep>
export type Dep = Set<ReactiveEffect>
export interface ReactiveEffect<T = any> {
    (): T
    _isEffect: true
    id: number
    active: boolean
    raw: () => T
    deps: Array<Dep>
    options: ReactiveEffectOptions
}

// computed
export type ComputedGetter<T> = (ctx?: any) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export interface ReactiveEffectOptions {
    lazy?: boolean
    scheduler?: (job: ReactiveEffect) => void
}


// render
export interface RendererNode {
    [key: string]: any
}

export interface RendererElement extends RendererNode {}

export type RootRenderFunction<HostElement = RendererElement> = (
    vnode: VNode,
    container: HostElement
) => void

// vnode
type VNodeChildAtom =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void

export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>

export type VNodeChild = VNodeChildAtom | VNodeArrayChildren

export type VNodeNormalizedChildren =
  | string
  | VNodeArrayChildren
  | null

export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = { [key: string]: any }
> {
  [ReactiveFlags.SKIP]: true
  type: any
  props: ExtraProps | null
  key: string | number | null
  children: VNodeNormalizedChildren
  component: ComponentInstance | null

  // DOM
  el: HostNode | null
  target: HostElement | null // teleport target

  // optimization only
  shapeFlag: number
  patchFlag: number
  dynamicProps: string[] | null
  dynamicChildren: VNode[] | null
}

export const enum ShapeFlags {
    ELEMENT = 1,
    FUNCTIONAL_COMPONENT = 1 << 1,
    STATEFUL_COMPONENT = 1 << 2,
    TEXT_CHILDREN = 1 << 3,
    ARRAY_CHILDREN = 1 << 4,
    SLOTS_CHILDREN = 1 << 5,
    TELEPORT = 1 << 6,
    SUSPENSE = 1 << 7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
    COMPONENT_KEPT_ALIVE = 1 << 9,
    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}

export type Data = Record<string, unknown>

export type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement,
  anchor?: RendererNode | null,
) => void

export type SetupRenderEffectFn = (
  instance: ComponentInstance,
  container: RendererElement,
) => void

export type ComponentFn = (
  initialVNode: VNode,
  container: RendererElement,
) => void

export interface ComponentInstance {
  type: any
  vnode: VNode
  next: VNode | null
  // 存储旧节点
  subTree: VNode
  // reactive effect for rendering and patching the component
  update: ReactiveEffect
  // The render function that returns vdom tree.
  render: any
  /**
   * Tracking reactive effects (e.g. watchers) associated with this component
   * so that they can be automatically stopped on component unmount
   * @internal
   */
  effects: ReactiveEffect[] | null
  // main proxy that serves as the public instance (`this`)
  proxy: any

  // state
  props: Data

  setupState: Data

  // lifecycle
  isMounted: boolean

  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  [LifecycleHooks.MOUNTED]: LifecycleHook
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  [LifecycleHooks.UPDATED]: LifecycleHook
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  [LifecycleHooks.UNMOUNTED]: LifecycleHook
}

// 节点操作接口
export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  insert(el: RendererNode, parent: RendererElement, anchor?: RendererNode | null): void
  remove(el: HostNode): void
  patchProp(
    el: RendererNode,
    key: string,
    prevValue: any,
    nextValue: any,
  ): void
  createElement(
    type: string,
    isSVG?: boolean,
    isCustomizedBuiltIn?: string
  ): HostElement
  createText(text: string): HostNode
  createComment(text: string): HostNode
  setText(node: RendererNode, text: string): void
  setElementText(node: RendererNode, text: string): void
  parentNode(node: RendererElement): HostElement | null
  nextSibling(node: HostNode): HostNode | null
  querySelector?(selector: string): HostElement | null
  setScopeId?(el: HostElement, id: string): void
  cloneNode?(node: HostNode): HostNode
}

export type DOMRenderOptions = RendererOptions<Node, Element> 

export type Style = string | Record<string, string> | null

// diff 优化
export const enum PatchFlags {
  TEXT = 1,
  CLASS = 1 << 1,
  STYLE = 1 << 2,
  PROPS = 1 << 3,
  FULL_PROPS = 1 << 4,
  HYDRATE_EVENTS = 1 << 5,
  STABLE_FRAGMENT = 1 << 6,
  KEYED_FRAGMENT = 1 << 7,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,
  DYNAMIC_SLOTS = 1 << 10,
  DEV_ROOT_FRAGMENT = 1 << 11,
  HOISTED = -1,
  BAIL = -2
}

// SchedulerJob
export interface SchedulerJob {
  (): void
  id?: number
  allowRecurse?: boolean
}

// life cycle hooks
export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

type LifecycleHook = Function[] | null

export interface CreateHook {
  (lifecycle: LifecycleHooks): 
    <T extends Function = () => any>(hook: T, target: ComponentInstance | null) => void
}

// compiler
export interface ParserContext {
  readonly originalSource: string
  source: string
  offset: number
  line: number
  column: number
  inPre: boolean // HTML <pre> tag, preserve whitespaces
  inVPre: boolean // v-pre, do not process directives and interpolations
}

export interface Position {
  offset: number // from start of file
  line: number
  column: number
}

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,
}

export const enum TextModes {
  //          | Elements | Entities | End sign              | Inside of
  DATA, //    | ✔        | ✔        | End tags of ancestors |
  RCDATA, //  | ✘        | ✔        | End tag of the parent | <textarea>
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE
}

export const enum Namespaces {
  HTML
}