import { CompiledModifiers } from '../modifiers/modifier.js';

export interface ArchNode {
  tag: string;
  attrs: Record<string, string>;
  modifiers?: CompiledModifiers;
  children?: ArchNode[];

  // QWeb specific attributes
  type?: 'if' | 'foreach';
  expr?: string;
  as?: string;
}
