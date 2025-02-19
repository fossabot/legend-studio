/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { observable, action, makeObservable, override } from 'mobx';
import { hashArray, type Hashable } from '@finos/legend-shared';
import { CORE_HASH_STRUCTURE } from '../../../../../MetaModelConst';
import {
  type PackageableElementVisitor,
  PackageableElement,
} from '../PackageableElement';
import type { EngineRuntime } from './Runtime';

export class PackageableRuntime extends PackageableElement implements Hashable {
  runtimeValue!: EngineRuntime;

  constructor(name: string) {
    super(name);

    makeObservable<PackageableRuntime, '_elementHashCode'>(this, {
      runtimeValue: observable,
      setRuntimeValue: action,
      _elementHashCode: override,
    });
  }

  setRuntimeValue(value: EngineRuntime): void {
    this.runtimeValue = value;
  }

  protected override get _elementHashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.PACKAGEABLE_RUNTIME,
      this.path,
      this.runtimeValue,
    ]);
  }

  accept_PackageableElementVisitor<T>(
    visitor: PackageableElementVisitor<T>,
  ): T {
    return visitor.visit_PackageableRuntime(this);
  }
}
