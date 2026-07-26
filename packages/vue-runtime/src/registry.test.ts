import { describe, test, expect } from 'vitest';
import { Registry, componentRegistry } from './registry.js';
import { ACTION_MANAGER_KEY, ROUTER_KEY, SESSION_KEY } from './di.js';
import { provide, inject, defineComponent, createApp } from 'vue';
import { ActionManager } from '@odoo/sdk';

describe('Odoo Vue Component Registry & DI Bus', () => {
  test('should register and retrieve items by category/name successfully', () => {
    const fieldsRegistry = new Registry<any>();

    const MockMany2One = { name: 'FieldMany2one' };
    fieldsRegistry.add('many2one', MockMany2One);

    expect(fieldsRegistry.has('many2one')).toBe(true);
    expect(fieldsRegistry.get('many2one')).toBe(MockMany2One);
    expect(fieldsRegistry.has('char')).toBe(false);
  });

  test('should throw an error when retrieving unregistered items', () => {
    const registry = new Registry<any>();
    expect(() => registry.get('many2one')).toThrow('Registry item not found: many2one');
  });

  test('should declare valid InjectionKeys for Vue provide/inject DI boundaries', () => {
    expect(typeof ACTION_MANAGER_KEY).toBe('symbol');
    expect(typeof ROUTER_KEY).toBe('symbol');
    expect(typeof SESSION_KEY).toBe('symbol');
  });
});
