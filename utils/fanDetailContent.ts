import type { Product } from '../types';
import { getTp09Content } from './tp09ProContent.ts';
import { getQ8ProContent } from './q8ProContent.ts';
import { get4319bContent } from './wallMount4319bContent.ts';
import { getQg830Content } from './qg830Content.ts';
import { getTp02PlusContent } from './tp02PlusContent.ts';
import { getTp02ThreeInOneContent } from './tp02ThreeInOneContent.ts';
import { getTp12Content } from './tp12Content.ts';

export const getFanDetailContent = (product?: Pick<Product, 'name' | 'slug' | 'specs'> | null) =>
  getTp12Content(product) || getTp02ThreeInOneContent(product) || getTp02PlusContent(product) || getQg830Content(product) || get4319bContent(product) || getQ8ProContent(product) || getTp09Content(product);
