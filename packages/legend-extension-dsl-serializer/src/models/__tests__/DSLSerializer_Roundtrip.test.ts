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

import type { Entity } from '@finos/legend-model-storage';
import { unitTest } from '@finos/legend-shared';
import { roundtripTestData } from './TEST_DATA__DSLSerializer_Roundtrip';
import { DSLSerializer_GraphPreset } from '../../DSLSerializer_Extension';
import {
  TEST__GraphPluginManager,
  TEST__checkBuildingElementsRoundtrip,
} from '@finos/legend-graph';

const pluginManager = new TEST__GraphPluginManager();
pluginManager.usePresets([new DSLSerializer_GraphPreset()]).install();

test(unitTest('DSL Serializer import resolution roundtrip'), async () => {
  await TEST__checkBuildingElementsRoundtrip(
    roundtripTestData as Entity[],
    pluginManager,
  );
});
