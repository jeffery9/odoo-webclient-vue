import { InjectionKey } from 'vue';
import { ActionManager, HashRouter, SessionManager } from '@odoo/sdk';

export const ACTION_MANAGER_KEY: InjectionKey<ActionManager> = Symbol('ActionManager');
export const ROUTER_KEY: InjectionKey<HashRouter> = Symbol('HashRouter');
export const SESSION_KEY: InjectionKey<SessionManager> = Symbol('SessionManager');
