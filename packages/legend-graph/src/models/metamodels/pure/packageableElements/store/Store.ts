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

import { observable, makeObservable } from 'mobx';
import type { Hashable } from '@finos/legend-shared';
import { PackageableElement } from '../PackageableElement';
import type { PackageableElementReference } from '../PackageableElementReference';

export abstract class Store extends PackageableElement implements Hashable {
  includes: PackageableElementReference<Store>[] = [];

  constructor(name: string) {
    super(name);

    makeObservable(this, {
      includes: observable,
    });
  }
}
