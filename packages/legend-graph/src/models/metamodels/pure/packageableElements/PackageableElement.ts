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

import { observable, action, computed, makeObservable } from 'mobx';
import {
  type Hashable,
  hashArray,
  hashString,
  IllegalStateError,
  uuid,
} from '@finos/legend-shared';
import {
  CORE_HASH_STRUCTURE,
  ELEMENT_PATH_DELIMITER,
} from '../../../../MetaModelConst';
import type { Package } from './domain/Package';
import type { Stubable } from '../../../../helpers/Stubable';
import type { Profile } from './domain/Profile';
import type { Enumeration } from './domain/Enumeration';
import type { Class } from './domain/Class';
import type { Association } from './domain/Association';
import type { ConcreteFunctionDefinition } from './domain/ConcreteFunctionDefinition';
import type { FlatData } from './store/flatData/model/FlatData';
import type { Mapping } from './mapping/Mapping';
import type { Service } from './service/Service';
import type { PrimitiveType } from './domain/PrimitiveType';
import type { Database } from './store/relational/model/Database';
import type { PackageableConnection } from './connection/PackageableConnection';
import type { PackageableRuntime } from './runtime/PackageableRuntime';
import type { FileGenerationSpecification } from './fileGeneration/FileGenerationSpecification';
import type { GenerationSpecification } from './generationSpecification/GenerationSpecification';
import type { Measure } from './domain/Measure';
import type { SectionIndex } from './section/SectionIndex';

export interface PackageableElementVisitor<T> {
  visit_PackageableElement(element: PackageableElement): T;
  visit_SectionIndex(element: SectionIndex): T;
  visit_Package(element: Package): T;
  visit_PrimitiveType(element: PrimitiveType): T;
  visit_Profile(element: Profile): T;
  visit_Enumeration(element: Enumeration): T;
  visit_Measure(element: Measure): T;
  visit_Class(element: Class): T;
  visit_Association(element: Association): T;
  visit_ConcreteFunctionDefinition(element: ConcreteFunctionDefinition): T;
  visit_PackageableConnection(element: PackageableConnection): T;
  visit_Mapping(element: Mapping): T;
  visit_PackageableRuntime(element: PackageableRuntime): T;

  visit_FlatData(element: FlatData): T;
  visit_Database(element: Database): T;
  visit_Service(element: Service): T;
  visit_FileGenerationSpecification(element: FileGenerationSpecification): T;
  visit_GenerationSpecification(element: GenerationSpecification): T;
}

export abstract class PackageableElement implements Hashable, Stubable {
  uuid = uuid();
  protected _isDeleted = false;
  protected _isDisposed = false;
  protected _isImmutable = false;
  name: string;
  package?: Package | undefined;
  generationParentElement?: PackageableElement | undefined;

  constructor(name: string) {
    makeObservable<
      PackageableElement,
      '_isDeleted' | '_isDisposed' | '_isImmutable' | '_elementHashCode'
    >(this, {
      _isDeleted: observable,
      _isDisposed: observable,
      _isImmutable: observable,
      name: observable,
      package: observable,
      isReadOnly: computed,
      isDeleted: computed,
      path: computed,
      _elementHashCode: computed,
      // We need to enable `keepAlive` to facillitate precomutation of element hash code
      hashCode: computed({ keepAlive: true }),
      setName: action,
      setPackage: action,
      setIsDeleted: action,
      deleteElementFromGraph: action,
      dispose: action,
      freeze: action,
    });

    this.name = name;
  }

  get isReadOnly(): boolean {
    return this._isImmutable;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  setName(value: string): void {
    this.name = value;
  }

  setPackage(val: Package | undefined): void {
    this.package = val;
  }

  setIsDeleted(value: boolean): void {
    this._isDeleted = value;
  }

  deleteElementFromGraph(): void {
    if (this.package) {
      this.package.deleteElement(this);
    }
    this.setIsDeleted(true);
  }

  /**
   * Get root element. In the ideal case, this method is important for finding the root package, but
   * if we do something like `this instanceof Package` that would case circular dependency.
   */
  getRoot(): PackageableElement {
    return !this.package ? this : this.package.getRoot();
  }

  get path(): string {
    if (!this.package) {
      return this.name;
    }
    const parentPackageName = this.package.fullPath;
    return !parentPackageName
      ? this.name
      : `${parentPackageName}${ELEMENT_PATH_DELIMITER}${this.name}`;
  }

  // NOTE: we don't need `createStub` as the subclasses will have to implement their own for type narrowing
  get isStub(): boolean {
    return !this.name && !this.package;
  }

  /**
   * Since `keepAlive` can cause memory-leak, we need to dispose it manually when we are about to discard the graph
   * in order to avoid leaking.
   * See https://mobx.js.org/best/pitfalls.html#computed-values-run-more-often-than-expected
   * See https://medium.com/terria/when-and-why-does-mobxs-keepalive-cause-a-memory-leak-8c29feb9ff55
   */
  dispose(): void {
    this._isDisposed = true;
    // trigger recomputation on `hashCode` so it removes itself from all observables it previously observed
    try {
      this.hashCode;
    } catch {
      /* do nothing */
    }
  }

  freeze(): void {
    this._isImmutable = true;
    // Since hash code computation depends on this flag, we retrigger and wrap in a try catch to prevent future call
    // to get `hashCode`, as this would indicate mutation
    try {
      this.hashCode;
    } catch {
      /* do nothing */
    }
  }

  protected get _elementHashCode(): string {
    return hashArray([CORE_HASH_STRUCTURE.PACKAGEABLE_ELEMENT, this.path]);
  }

  get hashCode(): string {
    if (this._isDisposed) {
      throw new IllegalStateError(`Element '${this.path}' is already disposed`);
    }
    // If this computation is placed after checking for immutability flag,
    // error will be thrown and therefore, `mobx` will not recompute this at all.
    // By putting this here, we make sure that even when the element is frozen,
    // if somehow the element modified, computation of the hash code will be triggered.
    // As a result, error will be thrown again. This is a good way to notify developer
    // that the object has been modified, this is a better alternative to than using
    // `Object.freeze`, which requires a more complicated setup.
    // Also, using `Object.freeze` does not really solve the problem
    // See https://github.com/mobxjs/mobx/issues/3008
    const hashCode = this._elementHashCode;
    if (this._isImmutable) {
      throw new IllegalStateError(
        `Readonly element '${this.path}' is modified`,
      );
    }
    return hashCode;
  }

  abstract accept_PackageableElementVisitor<T>(
    visitor: PackageableElementVisitor<T>,
  ): T;
}

export enum PACKAGEABLE_ELEMENT_TYPE {
  PRIMITIVE = 'PRIMITIVE',
  PACKAGE = 'PACKAGE',
  PROFILE = 'PROFILE',
  ENUMERATION = 'ENUMERATION',
  CLASS = 'CLASS',
  ASSOCIATION = 'ASSOCIATION',
  FUNCTION = 'FUNCTION',
  MEASURE = 'MEASURE',
  UNIT = 'UNIT',
  FLAT_DATA_STORE = 'FLAT_DATA_STORE',
  DATABASE = 'DATABASE',
  SERVICE_STORE = 'SERVICE_STORE',
  MAPPING = 'MAPPING',
  SERVICE = 'SERVICE',
  CONNECTION = 'CONNECTION',
  RUNTIME = 'RUNTIME',
  FILE_GENERATION = 'FILE_GENERATION',
  GENERATION_SPECIFICATION = 'GENERATION_SPECIFICATION',
  SECTION_INDEX = 'SECTION_INDEX',
}

export enum PACKAGEABLE_ELEMENT_POINTER_TYPE {
  STORE = 'STORE',
  MAPPING = 'MAPPING',
  FILE_GENERATION = 'FILE_GENERATION',
  SERVICE = 'SERVICE',
}

export const getElementPointerHashCode = (
  pointerType: PACKAGEABLE_ELEMENT_POINTER_TYPE,
  path: string,
): string =>
  [CORE_HASH_STRUCTURE.PACKAGEABLE_ELEMENT_POINTER, pointerType, path]
    .map(hashString)
    .join(',');
